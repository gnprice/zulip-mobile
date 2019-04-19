/* @flow strict-local */
import { applyMiddleware, compose, createStore } from 'redux';
import type { Store } from 'redux';
import { persistStore, autoRehydrate } from 'redux-persist';
import type { Config } from 'redux-persist';
import { AsyncStorage } from 'react-native';

import type { Action, GlobalState } from '../types';
import rootReducer from './reducers';
import middleware from './middleware';
import ZulipAsyncStorage from './ZulipAsyncStorage';
import createMigration from '../redux-persist-migrate/index';

// AsyncStorage.clear(); // use to reset storage during development

/**
 * Properties on the global store which we explicitly choose not to persist.
 *
 * All properties on the global store should appear either here or in the
 * lists of properties we do persist, below.
 */
// prettier-ignore
export const discardKeys = [
  'alertWords', 'caughtUp', 'fetching', 'loading',
  'nav', 'presence', 'session', 'topics', 'typing', 'userStatus',
];

/**
 * Properties on the global store which we persist because they are local.
 *
 * These represent information that belongs to this device (and this
 * install of the app), where things wouldn't work right if we didn't
 * persist them.
 */
export const storeKeys = ['migrations', 'accounts', 'drafts', 'outbox', 'settings'];

/**
 * Properties on the global store which we persist for caching's sake.
 *
 * These represent information for which the ground truth is on the
 * server, but which we persist locally so that we have it cached and
 * don't have to re-download it.
 */
// prettier-ignore
export const cacheKeys = [
  'flags', 'messages', 'mute', 'narrows', 'realm', 'streams', 'subscriptions', 'unread', 'userGroups', 'users',
];

const migrations: { [string]: (GlobalState) => GlobalState } = {
  '0': state => {
    // We deleted `messages` and created `narrows`.  (Really we renamed
    // `messages` to `narrows, but a migration for delete + create is
    // simpler, and is good enough because these are "cache" data anyway.)
    AsyncStorage.removeItem('reduxPersist:messages');
    const { messages, ...restState } = state; // eslint-disable-line no-unused-vars
    // $FlowMigrationFudge
    return { ...restState, narrows: {} };
  },
  '1': state => ({
    // We changed the format of `narrows` and created `messages`.  Just
    // initialize them both.
    ...state,
    messages: {},
    narrows: {},
  }),
  '2': state => ({
    ...state,
    // $FlowMigrationFudge
    realm: {
      ...state.realm,
      pushToken: {
        // $FlowMigrationFudge
        token: state.realm.pushToken.token,
        // Drop `result` and `msg`.
      },
    },
  }),
  '3': state => ({
    ...state,
    // $FlowMigrationFudge
    realm: {
      ...state.realm,
      pushToken: {
        // Previously we used an empty string here to mean "no value".
        // $FlowMigrationFudge
        token: state.realm.pushToken.token || null,
      },
    },
  }),
  '4': state => {
    // $FlowMigrationFudge
    const { pushToken, ...restRealm } = state.realm; // eslint-disable-line no-unused-vars
    return {
      ...state,
      realm: restRealm,
      accounts: state.accounts.map(a => ({ ...a, ackedPushToken: null })),
    };
  },
  '5': state => ({
    ...state,
    realm: {
      ...state.realm,
      emoji: (data =>
        new Map(Object.keys(data).map(id => [id, { ...data[id], code: id.toString() }])))(
        state.realm.emoji,
      ),
    },
  }),
};

const reduxPersistConfig: Config = {
  whitelist: [...storeKeys, ...cacheKeys],
  // $FlowFixMe: https://github.com/rt2zz/redux-persist/issues/823
  storage: ZulipAsyncStorage,
};

const store: Store<*, Action> = createStore(
  rootReducer,
  undefined,
  compose(
    createMigration(migrations, 'migrations'),
    applyMiddleware(...middleware),
    autoRehydrate(),
  ),
);

// TODO transform
// see https://github.com/rt2zz/redux-persist#transforms
//
// For Immutable.js, `remotedev-serialize` seems good quality:
//   https://github.com/zalmoxisus/remotedev-serialize/blob/master/immutable/serialize.js
//   https://github.com/zalmoxisus/remotedev-serialize/blob/master/helpers/index.js
//
// Oh hey, and it supports built-in `Map` and `Set` too!  That's doc'd;
// the implementation is less transparent, but it seems to be here:
//   https://github.com/kolodny/jsan/blob/master/lib/cycle.js
// and enabled here:
//   https://github.com/zalmoxisus/remotedev-serialize/blob/master/constants/options.js
// Anyway, that also looks like a good-quality implementation.
//
// More candidates for data structure:
//   https://github.com/immerjs/immer
// (via random web-search hit https://github.com/ianstormtaylor/slate/issues/2345 ,
// though that does not look like a well-aligned source)
export const restore = (onFinished?: () => void) =>
  persistStore(store, reduxPersistConfig, onFinished);

export default store;
