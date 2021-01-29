/* @flow strict-local */
import Immutable from 'immutable';

import type { Action } from '../actionTypes';
import type {
  UnreadState,
  UnreadStreamsState,
  UnreadPmsState,
  UnreadHuddlesState,
  UnreadMentionsState,
} from './unreadModelTypes';
import type { GlobalState } from '../reduxTypes';
import unreadPmsReducer from './unreadPmsReducer';
import unreadHuddlesReducer from './unreadHuddlesReducer';
import unreadMentionsReducer from './unreadMentionsReducer';
import {
  ACCOUNT_SWITCH,
  EVENT_MESSAGE_DELETE,
  EVENT_NEW_MESSAGE,
  EVENT_UPDATE_MESSAGE_FLAGS,
  LOGOUT,
  MESSAGE_FETCH_COMPLETE,
  REALM_INIT,
} from '../actionConstants';
import { getOwnUserId } from '../users/userSelectors';

//
//
// Selectors.
//

export const getUnreadStreams = (state: GlobalState): UnreadStreamsState => state.unread.streams;

export const getUnreadPms = (state: GlobalState): UnreadPmsState => state.unread.pms;

export const getUnreadHuddles = (state: GlobalState): UnreadHuddlesState => state.unread.huddles;

export const getUnreadMentions = (state: GlobalState): UnreadMentionsState => state.unread.mentions;

//
//
// Reducer.
//

const initialStreamsState: UnreadStreamsState = Immutable.Map();

// Like `Immutable.Map#update`, but prune returned values equal to `zero`.
function updateAndPrune<K, V>(
  map: Immutable.Map<K, V>,
  zero: V,
  key: K,
  updater: (V | void) => V,
): Immutable.Map<K, V> {
  const value = map.get(key);
  const newValue = updater(value);
  if (newValue === value) {
    return map;
  }
  if (newValue === zero) {
    return map.delete(key);
  } else {
    return map.set(key, newValue);
  }
}

// TODO doc/comment
function deleteFromList(
  list_: Immutable.List<number>,
  toDelete: Array<number>,
): Immutable.List<number> {
  // Alias the parameters because Flow doesn't accept mutating them.
  let list = list_;

  // First, see if some items to delete happen to be at the start, and
  // remove those.  This is  the common case for marking messages as read,
  // so it's worth some effort to optimize.  And we can do it efficiently:
  // for deleting the first k out of n messages, we take time O(k log n)
  // rather than O(n).
  let i = 0;
  for (const id of list) {
    if (i >= toDelete.length) {
      break;
    }
    if (id !== toDelete[i]) {
      break;
    }
    i++;
  }
  if (i > 0) {
    list = list.slice(i);
    toDelete.splice(0, i);
  }

  // That might have been all the items we wanted to delete.  In fact that's
  // the most common case for marking items as read.
  if (toDelete.length === 0) {
    return list;
  }

  // It wasn't; we have more to delete.  We'll have to find them in the
  // middle of the list and delete them wherever they are.
  // This takes time O(n).
  const toDeleteSet = new Set(toDelete);
  return list.filterNot(id => toDeleteSet.has(id));
}

function deleteMessages(
  state: UnreadStreamsState,
  ids: $ReadOnlyArray<number>,
  globalMessages,
): UnreadStreamsState {
  const byConversation =
    // prettier-ignore
    (Immutable.Map(): Immutable.Map<number, Immutable.Map<string, Array<number>>>)
    .withMutations(mut => {
      for (const id of ids) {
        const message = globalMessages.get(id);
        if (!message || message.type !== 'stream') {
          continue;
        }
        const { stream_id, subject: topic } = message;
        mut.updateIn([stream_id, topic], (l = []) => { l.push(id); return l; });
      }
    });

  const emptyMap = Immutable.Map();
  const emptyList = Immutable.List();
  // prettier-ignore
  return state.withMutations(stateMut => {
    byConversation.forEach((byTopic, streamId) => {
      updateAndPrune(stateMut, emptyMap, streamId, perStream =>
        perStream && perStream.withMutations(perStreamMut => {
          byTopic.forEach((msgIds, topic) => {
            updateAndPrune(perStreamMut, emptyList, topic, perTopic =>
              perTopic && deleteFromList(perTopic, msgIds),
            );
          });
        }),
      );
    });
  });
}

function streamsReducer(
  state: UnreadStreamsState = initialStreamsState,
  action: Action,
  globalState: GlobalState,
): UnreadStreamsState {
  switch (action.type) {
    case LOGOUT:
    case ACCOUNT_SWITCH:
      // TODO also LOGIN_SUCCESS, presumably, like some other reducers
      return initialStreamsState;

    case REALM_INIT: {
      // This may indeed be unnecessary, but it's legacy; have not investigated
      // if it's this bit of our API types that is too optimistic.
      // flowlint-next-line unnecessary-optional-chain:off
      const data = action.data.unread_msgs?.streams ?? [];

      const byStream = new Map();
      for (const { stream_id, topic, unread_message_ids } of data) {
        let perStream = byStream.get(stream_id);
        if (!perStream) {
          perStream = [];
          byStream.set(stream_id, perStream);
        }
        // unread_message_ids is already sorted; see comment at its
        // definition in src/api/initialDataTypes.js.
        perStream.push([topic, Immutable.List(unread_message_ids)]);
      }
      return Immutable.Map(Immutable.Seq.Keyed(byStream.entries()).map(Immutable.Map));
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

      if (message.sender_id === getOwnUserId(globalState)) {
        return state;
      }

      // prettier-ignore
      return state.updateIn([message.stream_id, message.subject],
        (perTopic = Immutable.List()) => perTopic.push(message.id));
    }

    case EVENT_MESSAGE_DELETE:
      // TODO optimize by using `state.messages` to look up directly
      return deleteMessages(state, action.messageIds, globalState.messages);

    case EVENT_UPDATE_MESSAGE_FLAGS: {
      if (action.flag !== 'read') {
        return state;
      }

      if (action.all) {
        return initialStreamsState;
      }

      if (action.operation === 'remove') {
        // Zulip doesn't support un-reading a message.  Ignore it.
        return state;
      }

      // TODO optimize by using `state.messages` to look up directly.
      //   Then when do, also optimize so deleting the oldest items is fast,
      //   as that should be the common case here.
      return deleteMessages(state, action.messages, globalState.messages);
    }

    default:
      return state;
  }
}

export const reducer = (
  state: void | UnreadState,
  action: Action,
  globalState: GlobalState,
): UnreadState => {
  const nextState = {
    streams: streamsReducer(state?.streams, action, globalState),
    pms: unreadPmsReducer(state?.pms, action),
    huddles: unreadHuddlesReducer(state?.huddles, action),
    mentions: unreadMentionsReducer(state?.mentions, action),
  };

  if (state && Object.keys(nextState).every(key => nextState[key] === state[key])) {
    return state;
  }

  return nextState;
};
