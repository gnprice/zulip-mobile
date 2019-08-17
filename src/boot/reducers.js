/* @flow strict-local */
import { combineReducers } from 'redux';
import type { CombinedReducer } from 'redux';
import { enableBatching } from 'redux-batched-actions';

import config from '../config';
import { logSlowReducers } from '../utils/redux';
import { NULL_OBJECT } from '../nullObjects';
import type { Action, GlobalState, MigrationsState } from '../types';

import accounts from '../account/accountsReducer';
import nav from '../nav/navReducer';

const reducers = {
  migrations: (state: MigrationsState = NULL_OBJECT) => state,
  accounts,
  nav,
};

export const ALL_KEYS: string[] = Object.keys(reducers);

const combinedReducer: CombinedReducer<GlobalState, Action> = combineReducers(
  config.enableReduxSlowReducerWarnings ? logSlowReducers(reducers) : reducers,
);

export default enableBatching(combinedReducer);
