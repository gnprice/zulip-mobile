/* @flow strict-local */
import {
  REALM_ADD,
  LOGIN_SUCCESS,
  ACCOUNT_SWITCH,
  ACK_PUSH_TOKEN,
  UNACK_PUSH_TOKEN,
  LOGOUT,
  ACCOUNT_REMOVE,
} from '../actionConstants';

import type { Account, Identity, Action } from '../types';
import { NULL_ARRAY } from '../nullObjects';

/**
 * The list of known accounts, with the active account first.
 *
 * Some accounts in the list may have a blank API key (if the user hasn't
 * yet completed login, or has logged out) or even a blank email (if the
 * user hasn't completed login.)
 *
 * See:
 *  * "active account" in `docs/glossary.md`.
 *  * `getIdentity`, `getAuth`, and related selectors, for getting
 *    information about the active account as needed in most codepaths of
 *    the app.
 *  * `Account` for details on the properties of each account object.
 */
export type AccountsState = Account[];

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

const accountSwitch = (state, action) => {
  if (action.index === 0) {
    return state;
  }

  return [state[action.index], ...state.slice(0, action.index), ...state.slice(action.index + 1)];
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
    { realm, email, apiKey, ackedPushToken: null },
    ...state.slice(0, accountIndex),
    ...state.slice(accountIndex + 1),
  ];
};

const ackPushToken = (state, action) => {
  const { pushToken: ackedPushToken, identity } = action;
  const accountIndex = findAccount(state, identity);
  if (accountIndex === -1) {
    return state;
  }
  return [
    ...state.slice(0, accountIndex),
    { ...state[accountIndex], ackedPushToken },
    ...state.slice(accountIndex + 1),
  ];
};

const unackPushToken = (state, action) => {
  const { identity } = action;
  const accountIndex = findAccount(state, identity);
  if (accountIndex === -1) {
    return state;
  }
  return [
    ...state.slice(0, accountIndex),
    { ...state[accountIndex], ackedPushToken: null },
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

    case ACCOUNT_SWITCH:
      return accountSwitch(state, action);

    case LOGIN_SUCCESS:
      return loginSuccess(state, action);

    case ACK_PUSH_TOKEN:
      return ackPushToken(state, action);

    case UNACK_PUSH_TOKEN:
      return unackPushToken(state, action);

    case LOGOUT: {
      const { realm, email } = state[0];
      return [{ realm, email, apiKey: '', ackedPushToken: null }, ...state.slice(1)];
    }

    case ACCOUNT_REMOVE:
      return accountRemove(state, action);

    default:
      return state;
  }
};
