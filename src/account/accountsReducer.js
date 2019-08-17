/* @flow strict-local */
import {
  REALM_ADD,
  LOGIN_SUCCESS,
  ACCOUNT_REMOVE,
} from '../actionConstants';

import type { AccountsState, Identity, Action } from '../types';
import { NULL_ARRAY } from '../nullObjects';

const initialState = NULL_ARRAY;

const realmAdd = (state, action) => {
  const accountIndex = state.findIndex(account => account.realm === action.realm);

  if (accountIndex !== -1) {
    return [state[accountIndex], ...state.slice(0, accountIndex), ...state.slice(accountIndex + 1)];
  }

  return [
    {
      realm: action.realm,
      apiKey: '',
      email: '',
      ackedPushToken: null,
    },
    ...state,
  ];
};

const findAccount = (state: AccountsState, identity: Identity): number => {
  const { realm, email } = identity;
  return state.findIndex(
    account => account.realm === realm && (!account.email || account.email === email),
  );
};

const loginSuccess = (state, action) => {
  const { realm, email, apiKey } = action;
  const accountIndex = findAccount(state, { realm, email });
  if (accountIndex === -1) {
    return [{ realm, email, apiKey, ackedPushToken: null }, ...state];
  }
  return [
    { ...state[accountIndex], email, apiKey },
    ...state.slice(0, accountIndex),
    ...state.slice(accountIndex + 1),
  ];
};

const accountRemove = (state, action) => {
  const newState = state.slice();
  newState.splice(action.index, 1);
  return newState;
};

export default (state: AccountsState = initialState, action: Action): AccountsState => {
  switch (action.type) {
    case REALM_ADD:
      return realmAdd(state, action);

    case LOGIN_SUCCESS:
      return loginSuccess(state, action);

    case ACCOUNT_REMOVE:
      return accountRemove(state, action);

    default:
      return state;
  }
};
