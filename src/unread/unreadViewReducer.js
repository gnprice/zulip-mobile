// @flow strict-local
import Immutable from 'immutable';

import { ACCOUNT_SWITCH, EVENT_NEW_MESSAGE, LOGOUT } from '../actionConstants';
import type { Action, GlobalState, UnreadStreamItem } from '../types';

export type UnreadViewState = Immutable.Map<number, UnreadStreamItem>;

const initialState: UnreadViewState = Immutable.Map();

// TODO this should be named with "stream", or should handle PM threads too
export default (
  state: UnreadViewState = initialState,
  action: Action,
  globalState: GlobalState,
): UnreadViewState => {
  switch (action.type) {
    case LOGOUT:
    case ACCOUNT_SWITCH:
      return initialState;

    case EVENT_NEW_MESSAGE: {
      const { message } = action;
      if (message.type !== 'stream') {
        return state;
      }
      /* eslint-disable arrow-body-style */
      return state.update(message.stream_id, streamData => {
        // TODO WORK HERE... but this is duplicating unreadStreamsReducer
        return streamData;
      });
    }

    // TODO oh gosh EVENT_SUBSCRIPTION, and others

    default:
      return state;
  }
};
