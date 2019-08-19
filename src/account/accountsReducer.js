/* @flow strict-local */
import {
  LOGIN_SUCCESS,
  ACCOUNT_REMOVE,
    REHYDRATE,
} from '../actionConstants';

import type { AccountsState, Action } from '../types';
import { NULL_ARRAY } from '../nullObjects';

const initialState = NULL_ARRAY;

const loginSuccess = (state, action) => {
  const { realm } = action;
  return [{ realm }, ...state];
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

  case REHYDRATE:
      return (action.payload && action.payload.accounts
	      ? action.payload.accounts : state);

    default:
      return state;
  }
};
