/* @flow strict-local */
import type { FetchingState, Action } from '../types';
import {
  LOGOUT,
  LOGIN_SUCCESS,
  ACCOUNT_SWITCH,
  MESSAGE_FETCH_START,
  MESSAGE_FETCH_ERROR,
  MESSAGE_FETCH_COMPLETE,
} from '../actionConstants';
import { NULL_OBJECT } from '../nullObjects';
import { DEFAULT_FETCHING } from './fetchingSelectors';
import { SearchNarrow } from '../utils/narrow';

const initialState: FetchingState = NULL_OBJECT;

const messageFetchStart = (state, action) => {
  // We don't want to accumulate old searches that we'll never need
  // again.
  if (action.narrow.clean instanceof SearchNarrow) {
    return state;
  }

  const key = JSON.stringify(action.narrow.strings);
  const currentValue = state[key] || DEFAULT_FETCHING;

  return {
    ...state,
    [key]: {
      older: currentValue.older || action.numBefore > 0,
      newer: currentValue.newer || action.numAfter > 0,
    },
  };
};

const messageFetchError = (state, action) => {
  const key = JSON.stringify(action.narrow.strings);

  if (action.narrow.clean instanceof SearchNarrow) {
    return state;
  }

  return {
    ...state,
    [key]: DEFAULT_FETCHING,
  };
};

const messageFetchComplete = (state, action) => {
  // We don't want to accumulate old searches that we'll never need again.
  if (action.narrow.clean instanceof SearchNarrow) {
    return state;
  }
  const key = JSON.stringify(action.narrow.strings);
  const currentValue = state[key] || DEFAULT_FETCHING;

  return {
    ...state,
    [key]: {
      older: currentValue.older && !(action.numBefore > 0),
      newer: currentValue.newer && !(action.numAfter > 0),
    },
  };
};

export default (state: FetchingState = initialState, action: Action): FetchingState => {
  switch (action.type) {
    case LOGOUT:
    case LOGIN_SUCCESS:
    case ACCOUNT_SWITCH:
      return initialState;

    case MESSAGE_FETCH_START:
      return messageFetchStart(state, action);

    /**
     * The reverse of MESSAGE_FETCH_START, for cleanup.
     */
    case MESSAGE_FETCH_ERROR: {
      return messageFetchError(state, action);
    }

    case MESSAGE_FETCH_COMPLETE:
      return messageFetchComplete(state, action);

    default:
      return state;
  }
};
