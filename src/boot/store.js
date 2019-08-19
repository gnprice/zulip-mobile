/* @flow strict-local */
import { applyMiddleware, compose, createStore } from 'redux';
import type { Store } from 'redux';
import { persistStore, autoRehydrate } from 'redux-persist';
import type { Config } from 'redux-persist';

import type { Action, GlobalState } from '../types';
import rootReducer from './reducers';
import middleware from './middleware';
import ZulipAsyncStorage from './ZulipAsyncStorage';

// AsyncStorage.clear(); // use to reset storage during development

/**
 * Properties on the global store which we explicitly choose not to persist.
 *
 * All properties on the global store should appear either here or in the
 * lists of properties we do persist, below.
 */
// prettier-ignore
export const discardKeys: Array<$Keys<GlobalState>> = [
  'nav',
];

/**
 * Properties on the global store which we persist because they are local.
 *
 * These represent information that belongs to this device (and this
 * install of the app), where things wouldn't work right if we didn't
 * persist them.
 */
// prettier-ignore
export const storeKeys: Array<$Keys<GlobalState>> = [
  'migrations', 'accounts',
];

/**
 * Properties on the global store which we persist for caching's sake.
 *
 * These represent information for which the ground truth is on the
 * server, but which we persist locally so that we have it cached and
 * don't have to re-download it.
 */
// prettier-ignore
export const cacheKeys: Array<$Keys<GlobalState>> = [
];

const reduxPersistConfig: Config = {
  whitelist: [...storeKeys, ...cacheKeys],
  // $FlowFixMe: https://github.com/rt2zz/redux-persist/issues/823
  storage: ZulipAsyncStorage,
};

const store: Store<*, Action> = createStore(
  rootReducer,
  undefined,
  compose(
    applyMiddleware(...middleware),
    autoRehydrate(),
  ),
);

export const restore = (onFinished?: () => void) =>
  persistStore(store, reduxPersistConfig, onFinished);

export default store;
