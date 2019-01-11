/* @flow strict-local */
import type { Action, FlagsState, Message } from '../types';
import {
  DEAD_QUEUE,
  MESSAGE_FETCH_COMPLETE,
  EVENT_NEW_MESSAGE,
  EVENT_UPDATE_MESSAGE_FLAGS,
  MARK_MESSAGES_READ,
  ACCOUNT_SWITCH,
} from '../actionConstants';
import { deeperMerge } from '../utils/misc';

const initialState = {
  read: {},
  starred: {},
  collapsed: {},
  mentions: {},
  wildcard_mentions: {},
  summarize_in_home: {},
  summarize_in_stream: {},
  force_expand: {},
  force_collapse: {},
  has_alert_word: {},
  historical: {},
  is_me_message: {},
};

const addFlagsForMessages = (
  state,
  messages: $ReadOnlyArray<number>,
  flags?: $ReadOnlyArray<string>,
) => {
  if (!messages || messages.length === 0 || !flags || flags.length === 0) {
    return state;
  }

  const newState: $Shape<FlagsState> = {};

  flags.forEach(flag => {
    newState[flag] = { ...(state[flag] || {}) };

    messages.forEach(message => {
      newState[flag][message] = true;
    });
  });

  return {
    ...state,
    ...newState,
  };
};

const removeFlagForMessages = (state, messages: number[], flag: string) => {
  const newStateForFlag: { [number]: boolean } = { ...(state[flag] || {}) };
  messages.forEach(message => {
    delete newStateForFlag[message];
  });
  return {
    ...state,
    [flag]: newStateForFlag,
  };
};

const processFlagsForMessages = (state, messages: Message[]) => {
  let stateChanged = false;
  const newState: $Shape<FlagsState> = {};
  messages.forEach(msg => {
    (msg.flags || []).forEach(flag => {
      if (!state[flag] || !state[flag][msg.id]) {
        if (!newState[flag]) {
          newState[flag] = {};
        }
        newState[flag][msg.id] = true;
        stateChanged = true;
      }
    });
  });

  // $FlowFixMe: Flow can't follow this objects-as-maps logic.
  return stateChanged ? (deeperMerge(state, newState): FlagsState) : state;
};

const eventUpdateMessageFlags = (state, action) => {
  if (action.all) {
    return addFlagsForMessages(initialState, Object.keys(action.allMessages).map(Number), ['read']);
  }

  if (action.operation === 'add') {
    return addFlagsForMessages(state, action.messages, [action.flag]);
  }

  if (action.operation === 'remove') {
    return removeFlagForMessages(state, action.messages, action.flag);
  }

  return state;
};

export default (state: FlagsState = initialState, action: Action): FlagsState => {
  switch (action.type) {
    case DEAD_QUEUE:
    case ACCOUNT_SWITCH:
      return initialState;

    case MESSAGE_FETCH_COMPLETE:
      return processFlagsForMessages(state, action.messages);

    case EVENT_NEW_MESSAGE:
      return addFlagsForMessages(state, [action.message.id], action.message.flags);

    case EVENT_UPDATE_MESSAGE_FLAGS:
      return eventUpdateMessageFlags(state, action);

    case MARK_MESSAGES_READ:
      return addFlagsForMessages(state, action.messageIds, ['read']);

    default:
      return state;
  }
};
