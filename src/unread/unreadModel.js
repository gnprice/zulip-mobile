/* @flow strict-local */
import Immutable from 'immutable';
import invariant from 'invariant';

import type { Narrow, UserId } from '../types';
import { userIdsOfPmNarrow } from '../utils/narrow';
import { pmUnreadsKeyFromPmKeyIds } from '../utils/recipient';
import type { PerAccountApplicableAction } from '../actionTypes';
import type {
  UnreadState,
  UnreadStreamsIndex,
  UnreadStreamsState,
  UnreadPmsState,
  UnreadHuddlesState,
  UnreadMentionsState,
} from './unreadModelTypes';
import type { PerAccountState } from '../reduxTypes';
import unreadPmsReducer from './unreadPmsReducer';
import unreadHuddlesReducer from './unreadHuddlesReducer';
import unreadMentionsReducer from './unreadMentionsReducer';
import {
  ACCOUNT_SWITCH,
  EVENT_MESSAGE_DELETE,
  EVENT_NEW_MESSAGE,
  EVENT_UPDATE_MESSAGE,
  EVENT_UPDATE_MESSAGE_FLAGS,
  LOGOUT,
  MESSAGE_FETCH_COMPLETE,
  REGISTER_COMPLETE,
} from '../actionConstants';
import * as logging from '../utils/logging';

//
//
// Selectors.
//
// These take the global state as their input.
//

/** The unread-messages state as a whole. */
export const getUnread = (state: PerAccountState): UnreadState => state.unread;

export const getUnreadStreams = (state: PerAccountState): UnreadStreamsIndex =>
  state.unread.streams.byStream;

export const getUnreadPms = (state: PerAccountState): UnreadPmsState => state.unread.pms;

export const getUnreadHuddles = (state: PerAccountState): UnreadHuddlesState =>
  state.unread.huddles;

export const getUnreadMentions = (state: PerAccountState): UnreadMentionsState =>
  state.unread.mentions;

//
//
// Getters.
//
// These operate directly on this particular model's state, as part of this
// model's own interface.
//

/** The total number of unreads in the given topic. */
export const getUnreadCountForTopic = (
  unread: UnreadState,
  streamId: number,
  topic: string,
): number => unread.streams.byStream.get(streamId)?.get(topic)?.size ?? 0;

/** All the unread message IDs for a given PM narrow. */
export const getUnreadIdsForPmNarrow = (
  unread: UnreadState,
  narrow: Narrow,
  ownUserId: UserId,
): $ReadOnlyArray<number> => {
  const userIds = userIdsOfPmNarrow(narrow);

  if (userIds.length > 1) {
    const unreadsKey = pmUnreadsKeyFromPmKeyIds(userIds, ownUserId);
    const unreadItem = unread.huddles.find(x => x.user_ids_string === unreadsKey);
    return unreadItem?.unread_message_ids ?? [];
  } else {
    const senderId = userIds[0];
    const unreadItem = unread.pms.find(x => x.sender_id === senderId);
    return unreadItem?.unread_message_ids ?? [];
  }
};

//
//
// Reducer.
//

const initialStreamsState: UnreadStreamsState = {
  byStream: Immutable.Map(),
  byMessage: Immutable.Map(),
};

// Like `Immutable.Map#update`, but prune returned values equal to `zero`.
function updateAndPrune<K, V>(
  map: Immutable.Map<K, V>,
  zero: V,
  key: K,
  updater: (V | void) => V,
): Immutable.Map<K, V> {
  const value = map.get(key);
  const newValue = updater(value);
  if (newValue === zero) {
    return map.delete(key);
  }
  if (newValue === value) {
    return map;
  }
  return map.set(key, newValue);
}

/**
 * Remove the given values from the list.
 *
 * This is equivalent to
 *   list_.filter(x => toDelete.indexOf(x) < 0)
 * but more efficient.
 *
 * Specifically, for n items in the list and k to delete, this takes time
 * O(n log n) in the worst case.
 *
 * In the case where the items to delete all appear at the beginning of the
 * list, and in the same order, it takes time O(k log n).  (This is the
 * common case when marking messages as read, which motivates this
 * optimization.)
 */
// In principle this should be doable in time O(k + log n) in the
// all-at-start case.  We'd need the iterator on Immutable.List to support
// iterating through the first k elements in O(k + log n) time.  It seems
// like it should be able to do that, but the current implementation (as of
// Immutable 4.0.0-rc.12) takes time O(k log n): each step of the iterator
// passes through a stack of log(n) helper functions.  Ah well.
//
// The logs are base 32, so in practice our log(n) is never more than 3
// (which would be enough for 32**3 = 32768 items), usually at most 2
// (enough for 1024 items); and for the messages in one conversation, very
// commonly 1, i.e. there are commonly just ≤32 messages.  So the difference
// between O(k log n) and O(k + log n) might be noticeable but is unlikely
// to be catastrophic.
function deleteFromList<V>(list_: Immutable.List<V>, toDelete_: Iterable<V>): Immutable.List<V> {
  // Alias the parameters because Flow doesn't accept mutating them.
  let list = list_;
  let toDelete = Immutable.List(toDelete_);

  // First, see if some items to delete happen to be at the start, and
  // remove those.  This is the common case for marking messages as read,
  // so it's worth some effort to optimize.  And we can do it efficiently:
  // for deleting the first k out of n messages, we take time O(k log n)
  // rather than O(n).

  const minSize = Math.min(list.size, toDelete.size);
  let i = 0;
  for (; i < minSize; i++) {
    // This loop takes time O(log n) per iteration, O(k log n) total.
    if (list.get(i) !== toDelete.get(i)) {
      break;
    }
  }

  if (i > 0) {
    // This takes time O(log n).
    list = list.slice(i);
    // This takes time O(log k) ≤ O(log n).
    toDelete = toDelete.slice(i);
  }

  // That might have been all the items we wanted to delete.
  // In fact that's the most common case when marking items as read.
  if (toDelete.isEmpty()) {
    return list;
  }

  // It wasn't; we have more to delete.  We'll have to find them in the
  // middle of the list and delete them wherever they are.
  //
  // This takes time O(n log n), probably (though an ideal implementation of
  // Immutable should be able to make it O(n).)
  const toDeleteSet = new Set(toDelete);
  return list.filterNot(id => toDeleteSet.has(id));
}

/**
 * Delete the given messages from the unreads state.
 *
 * This is efficient at deleting some messages even when the total number of
 * existing messages is much larger.  Specifically the time spent should be
 * O(N' log n + c log C), where the messages to delete appear in c out of a
 * total of C conversations, and the affected conversations have a total of
 * N' messages and at most n in any one conversation.  If the messages to be
 * deleted are all at the start of the list for their respective
 * conversations the time should be O(k log n + c log C), where there are
 * k messages to delete.
 *
 * For the common case of marking some messages as read, we expect that all
 * the affected messages will indeed be at the start of their respective
 * conversations, and the number c of affected conversations will be small,
 * typically 1.  (It could be more than 1 if reading a stream narrow, or
 * other interleaved narrow.)
 */
function deleteMessages(
  state: UnreadStreamsState,
  ids: $ReadOnlyArray<number>,
): UnreadStreamsState {
  const stateByMessage = state.byMessage;

  const todoByStream = new Map();
  for (const id of ids) {
    const message = stateByMessage.get(id);
    if (!message) {
      // Not an unread we know about.  (Could be an ancient unread.)
      continue;
    }
    const { streamId, topic } = message;
    let todoForStream = todoByStream.get(streamId);
    if (!todoForStream) {
      todoForStream = new Map();
      todoByStream.set(streamId, todoForStream);
    }
    let todoForTopic = todoForStream.get(topic);
    if (!todoForTopic) {
      todoForTopic = [];
      todoForStream.set(topic, todoForTopic);
    }
    todoForTopic.push(id);
  }

  const emptyMap = Immutable.Map();
  const emptyList = Immutable.List();
  return {
    byStream: state.byStream.withMutations(stateByStream => {
      todoByStream.forEach((todoForStream, streamId) => {
        // prettier-ignore
        updateAndPrune(stateByStream, emptyMap, streamId, stateForStream =>
          // eslint-disable-next-line no-shadow
          stateForStream && stateForStream.withMutations(stateForStream => {
            todoForStream.forEach((todoForTopic, topic) => {
              updateAndPrune(stateForStream, emptyList, topic, stateForTopic =>
                stateForTopic && deleteFromList(stateForTopic, todoForTopic),
              );
            });
          }),
        );
      });
    }),
    byMessage: state.byMessage.deleteAll(ids),
  };
}

function streamsReducer(
  state: UnreadStreamsState = initialStreamsState,
  action: PerAccountApplicableAction,
  globalState: PerAccountState,
): UnreadStreamsState {
  switch (action.type) {
    case LOGOUT:
    case ACCOUNT_SWITCH:
      // TODO(#4446) also LOGIN_SUCCESS, presumably
      return initialStreamsState;

    case REGISTER_COMPLETE: {
      // This may indeed be unnecessary, but it's legacy; have not investigated
      // if it's this bit of our API types that is too optimistic.
      // flowlint-next-line unnecessary-optional-chain:off
      const data = action.data.unread_msgs?.streams ?? [];

      // First, collect together all the data for a given stream, just in a
      // plain old Array.
      const byStream = new Map();
      const byMessage = [];
      for (const { stream_id, topic, unread_message_ids } of data) {
        let perStream = byStream.get(stream_id);
        if (!perStream) {
          perStream = [];
          byStream.set(stream_id, perStream);
        }
        // unread_message_ids is already sorted; see comment at its
        // definition in src/api/initialDataTypes.js.
        perStream.push([topic, Immutable.List(unread_message_ids)]);
        for (const id of unread_message_ids) {
          byMessage.push([id, { streamId: stream_id, topic }]);
        }
      }

      // Then, for each of those plain Arrays build an Immutable.Map from it
      // all in one shot.  This is quite a bit faster than building the Maps
      // incrementally.  For a user with lots of unreads in a busy org, we
      // can be handling 50k message IDs here, across perhaps 2-5k threads
      // in dozens of streams, so the effect is significant.
      return {
        byStream: Immutable.Map(Immutable.Seq.Keyed(byStream.entries()).map(Immutable.Map)),
        byMessage: Immutable.Map(byMessage),
      };
    }

    case MESSAGE_FETCH_COMPLETE:
      // TODO handle MESSAGE_FETCH_COMPLETE here.  This rarely matters, but
      //   could in principle: we could be fetching some messages from
      //   before the (long) window included in the initial unreads data.
      //   For comparison, the webapp does handle this case; see the call to
      //   message_util.do_unread_count_updates in message_fetch.js.
      return state;

    case EVENT_NEW_MESSAGE: {
      const { message } = action;
      if (message.type !== 'stream') {
        return state;
      }

      invariant(message.flags, 'message in EVENT_NEW_MESSAGE must have flags');
      if (message.flags.includes('read')) {
        return state;
      }

      return {
        byStream: state.byStream.updateIn(
          [message.stream_id, message.subject],
          (perTopic = Immutable.List()) => perTopic.push(message.id),
        ),
        byMessage: state.byMessage.set(message.id, {
          streamId: message.stream_id,
          topic: message.subject,
        }),
      };
    }

    case EVENT_MESSAGE_DELETE:
      return deleteMessages(state, action.messageIds);

    case EVENT_UPDATE_MESSAGE_FLAGS: {
      if (action.flag !== 'read') {
        return state;
      }

      if (action.all) {
        return initialStreamsState;
      }

      if (action.op === 'remove') {
        // Zulip doesn't support un-reading a message.  Ignore it.
        return state;
      }

      return deleteMessages(state, action.messages);
    }

    case EVENT_UPDATE_MESSAGE: {
      // The API uses "new" for the stream IDs and "orig" for the topics.
      // Put them both in a consistent naming convention.
      const origStreamId = action.stream_id;
      if (origStreamId == null) {
        // Not stream messages, or else a pure content edit (no stream/topic change.)
        // TODO(server-5.0): Simplify comment: since FL 112 this means it's
        //   just not a stream message.
        return state;
      }
      const newStreamId = action.new_stream_id ?? origStreamId;
      const origTopic = action.orig_subject;
      const newTopic = action.subject ?? origTopic;

      if (newTopic === origTopic && newStreamId === origStreamId) {
        // Stream and topic didn't change.
        return state;
      }

      if (origTopic == null) {
        // `orig_subject` is documented to be present when either the
        // stream or topic changed.
        logging.warn('Got update_message event with stream/topic change and no orig_subject');
        return state;
      }
      invariant(newTopic != null, 'newTopic must be non-nullish when origTopic is, by `??`');

      const actionIds = new Set(action.message_ids);
      const matchingIds = state.byStream
        .getIn([origStreamId, origTopic], Immutable.List())
        .filter(id => actionIds.has(id));
      if (matchingIds.size === 0) {
        // None of the updated messages were unread.
        return state;
      }

      return {
        byStream: state.byStream.withMutations(byStream => {
          byStream.updateIn([origStreamId, origTopic], (messages = Immutable.List()) =>
            messages.filter(id => !actionIds.has(id)),
          );
          byStream.updateIn([newStreamId, newTopic], (messages = Immutable.List()) =>
            messages.push(...matchingIds).sort(),
          );
        }),
        byMessage: state.byMessage.withMutations(byMessage => {
          for (const id of matchingIds) {
            byMessage.set(id, { streamId: newStreamId, topic: newTopic });
          }
        }),
      };
    }

    default:
      return state;
  }
}

export const reducer = (
  state: void | UnreadState,
  action: PerAccountApplicableAction,
  globalState: PerAccountState,
): UnreadState => {
  const nextState = {
    streams: streamsReducer(state?.streams, action, globalState),

    // Note for converting these other sub-reducers to the new design:
    // Probably first push this four-part data structure down through the
    // `switch` statement, and the other logic that's duplicated between them.
    pms: unreadPmsReducer(state?.pms, action),
    huddles: unreadHuddlesReducer(state?.huddles, action),
    mentions: unreadMentionsReducer(state?.mentions, action),
  };

  if (state && Object.keys(nextState).every(key => nextState[key] === state[key])) {
    return state;
  }

  return nextState;
};
