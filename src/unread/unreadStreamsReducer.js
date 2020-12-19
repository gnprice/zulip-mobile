/* @flow strict-local */
import Immutable from 'immutable';
import invariant from 'invariant';

import type { Action, GlobalState } from '../types';
import type { UnreadStreamsState } from './unreadModelTypes';
import {
  REALM_INIT,
  LOGOUT,
  ACCOUNT_SWITCH,
  EVENT_NEW_MESSAGE,
  EVENT_MESSAGE_DELETE,
  EVENT_UPDATE_MESSAGE_FLAGS,
} from '../actionConstants';
import { getOwnUserId } from '../users/userSelectors';
import { removeItemsFromArray } from '../utils/immutability';

const initialState: UnreadStreamsState = Immutable.Map();

const eventNewMessage = (state, action, globalState): UnreadStreamsState => {
  if (action.message.type !== 'stream') {
    return state;
  }

  if (getOwnUserId(globalState) === action.message.sender_id) {
    return state;
  }

  const { id: message_id, stream_id, subject: topic } = action.message;

  // TODO this can surely be deduped to simplify further; withMutations? updateIn?

  const forStream = state.get(stream_id);
  if (!forStream) {
    return state.set(stream_id, Immutable.Map().set(topic, [message_id]));
  }

  const forTopic = forStream.get(topic);
  if (!forTopic) {
    return state.set(stream_id, forStream.set(topic, [message_id]));
  }

  if (forTopic.includes(message_id)) {
    return state;
  }

  return state.set(stream_id, forStream.set(topic, [...forTopic, message_id]));
};

const removeItemsDeeply = (state, messageIds): UnreadStreamsState =>
  state.withMutations(stateMutable => {
    for (const streamId of state.keys()) {
      const forStream = state.get(streamId);
      invariant(forStream, 'missing key');

      const newForStream = forStream.withMutations(forStreamMutable => {
        for (const topic of forStream.keys()) {
          const forTopic = forStream.get(topic);
          invariant(forTopic, 'missing key');

          const filteredIds = removeItemsFromArray(forTopic, messageIds);

          if (filteredIds === forTopic) {
            continue;
          }
          if (filteredIds.length === 0) {
            forStreamMutable.delete(topic);
          }
          forStreamMutable.set(topic, filteredIds);
        }
      });

      if (newForStream === forStream) {
        continue;
      }
      if (newForStream.size === 0) {
        stateMutable.delete(streamId);
      }
      stateMutable.set(streamId, newForStream);
    }
  });

const eventUpdateMessageFlags = (state, action) => {
  if (action.flag !== 'read') {
    return state;
  }

  if (action.all) {
    return initialState;
  }

  if (action.operation === 'add') {
    return removeItemsDeeply(state, action.messages);
  } else if (action.operation === 'remove') {
    // we do not support that operation
  }

  return state;
};

export default (
  state: UnreadStreamsState = initialState,
  action: Action,
  globalState: GlobalState,
): UnreadStreamsState => {
  switch (action.type) {
    case LOGOUT:
    case ACCOUNT_SWITCH:
      return initialState;

    case REALM_INIT:
      return Immutable.Map().withMutations(map => {
        // TODO see if this scenario can really happen
        // flowlint-next-line unnecessary-optional-chain:off
        for (const item of action.data.unread_msgs?.streams ?? []) {
          map.setIn([item.stream_id, item.topic], item.unread_message_ids);
        }
      });

    case EVENT_NEW_MESSAGE:
      return eventNewMessage(state, action, globalState);

    case EVENT_MESSAGE_DELETE:
      return removeItemsDeeply(state, action.messageIds);

    case EVENT_UPDATE_MESSAGE_FLAGS:
      return eventUpdateMessageFlags(state, action);

    default:
      return state;
  }
};
