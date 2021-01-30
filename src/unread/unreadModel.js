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

// Like `Immutable.Map#map`, but with the update-only-if-different semantics
// of `Immutable.Map#update`.  Kept for comparison to `updateAllAndPrune`.
/* eslint-disable-next-line no-unused-vars */
function updateAll<K, V>(map: Immutable.Map<K, V>, updater: V => V): Immutable.Map<K, V> {
  return map.withMutations(mapMut => {
    map.forEach((value, key) => {
      const newValue = updater(value);
      if (newValue !== value) {
        mapMut.set(key, newValue);
      }
    });
  });
}

// Like `updateAll`, but prune values equal to `zero` given by `updater`.
function updateAllAndPrune<K, V>(
  map: Immutable.Map<K, V>,
  zero: V,
  updater: V => V,
): Immutable.Map<K, V> {
  return map.withMutations(mapMut => {
    map.forEach((value, key) => {
      const newValue = updater(value);
      if (newValue === value) {
        return; // i.e., continue
      }
      if (newValue === zero) {
        mapMut.delete(key);
      } else {
        mapMut.set(key, newValue);
      }
    });
  });
}

function deleteMessages(
  state: UnreadStreamsState,
  ids: $ReadOnlyArray<number>,
): UnreadStreamsState {
  const idSet = new Set(ids);
  const toDelete = id => idSet.has(id);
  const emptyList = Immutable.List();
  return updateAllAndPrune(state, Immutable.Map(), perStream =>
    updateAllAndPrune(perStream, emptyList, perTopic =>
      perTopic.find(toDelete) ? perTopic.filterNot(toDelete) : perTopic,
    ),
  );
}

function streamsReducer(
  state: UnreadStreamsState = initialStreamsState,
  action: Action,
  globalState: GlobalState,
): UnreadStreamsState {
  switch (action.type) {
    case LOGOUT:
    case ACCOUNT_SWITCH:
      // TODO(#4446) also LOGIN_SUCCESS, presumably
      return initialStreamsState;

    case REALM_INIT: {
      // This may indeed be unnecessary, but it's legacy; have not investigated
      // if it's this bit of our API types that is too optimistic.
      // flowlint-next-line unnecessary-optional-chain:off
      const data = action.data.unread_msgs?.streams ?? [];

      const st = initialStreamsState.asMutable();
      for (const { stream_id, topic, unread_message_ids } of data) {
        // unread_message_ids is already sorted; see comment at its
        // definition in src/api/initialDataTypes.js.
        st.setIn([stream_id, topic], Immutable.List(unread_message_ids));
      }
      return st.asImmutable();
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
      return deleteMessages(state, action.messageIds);

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
      return deleteMessages(state, action.messages);
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
