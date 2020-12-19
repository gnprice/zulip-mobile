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

  // TODO this can surely be deduped to simplify further; withMutations?

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

const removeItemsDeeply = (state, messageIds): UnreadStreamsState => {
  let haveEmpty = false;
  const filtered = state.withMutations(stateMutable => {
    // TODO WORK HERE

    for (let i = 0; i < state.size; i++) {
      const elt = state.get(i);
      invariant(elt, 'bounds check');
      const filteredIds = removeItemsFromArray(elt.unread_message_ids, messageIds);
      if (filteredIds === elt.unread_message_ids) {
        continue;
      }
      stateMutable.set(i, { ...elt, unread_message_ids: filteredIds });
      haveEmpty = haveEmpty || filteredIds.length === 0;
    }
  });

  if (!haveEmpty) {
    return filtered;
  }

  return filtered.filter(elt => elt.unread_message_ids.length > 0);
};

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
      return action.data.unread_msgs
        ? Immutable.List(action.data.unread_msgs.streams)
        : initialState;

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
