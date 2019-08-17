/* @flow strict-local */
import type { Action } from '../types';
import {
  REALM_ADD,
  ACCOUNT_REMOVE,
  LOGIN_SUCCESS,
} from '../actionConstants';

export const realmAdd = (realm: string): Action => ({
  type: REALM_ADD,
  realm,
});

export const removeAccount = (index: number): Action => ({
  type: ACCOUNT_REMOVE,
  index,
});

export const loginSuccess = (realm: string, email: string, apiKey: string): Action => ({
  type: LOGIN_SUCCESS,
  realm,
  email,
  apiKey,
});
