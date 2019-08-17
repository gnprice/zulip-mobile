/* @flow strict-local */
import type {
  GlobalState,
  Account,
} from './types';

export const getAccounts = (state: GlobalState): Account[] => state.accounts;

