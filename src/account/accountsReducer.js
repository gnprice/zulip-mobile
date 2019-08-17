/* @flow strict-local */
import {
  LOGIN_SUCCESS,
  ACCOUNT_REMOVE,
} from '../actionConstants';

import type { AccountsState, Identity, Action } from '../types';
import { NULL_ARRAY } from '../nullObjects';

const initialState = NULL_ARRAY;

const loginSuccess = (state, action) => {
  const { realm, email, apiKey } = action;
  return [{ realm, email, apiKey, ackedPushToken: null }, ...state];
};

const accountRemove = (state, action) => {
  const newState = state.slice();
  newState.splice(action.index, 1);
  return newState;
};

export default (state: AccountsState = initialState, action: Action): AccountsState => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return loginSuccess(state, action);

    case ACCOUNT_REMOVE:
      return accountRemove(state, action);

    default:
      return state;
  }
};
