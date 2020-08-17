/* @flow strict-local */
import type { UsersState, Action } from '../types';
import {
  LOGOUT,
  LOGIN_SUCCESS,
  ACCOUNT_SWITCH,
  REALM_INIT,
  EVENT_USER_ADD,
  EVENT_USER_REMOVE,
  EVENT_USER_UPDATE,
} from '../actionConstants';
import { NULL_ARRAY } from '../nullObjects';
import { replaceItemInArray } from '../utils/immutability';

const initialState: UsersState = NULL_ARRAY;

export default (state: UsersState = initialState, action: Action): UsersState => {
  switch (action.type) {
    case LOGOUT:
    case LOGIN_SUCCESS:
    case ACCOUNT_SWITCH:
      return initialState;

    case REALM_INIT:
      return action.data.realm_users || initialState;

    case EVENT_USER_ADD:
      return [...state, action.person];

    case EVENT_USER_REMOVE:
      return state; // TODO

    case EVENT_USER_UPDATE: {
      if (!state.some(u => u.user_id === action.userId)) {
        // This should never happen because we only dispatch this
        // event if the user is already in state. But good to check,
        // just in case -- we don't want to trigger
        // `replaceItemInArray`'s logic for when it doesn't find the
        // item to be replaced.
        return state;
      }
      return replaceItemInArray(
        state,
        u => u.user_id === action.userId,
        u => ({ ...u, ...action.person }),
      );
    }

    default:
      return state;
  }
};
