/* @flow strict-local */
import { applyMiddleware, compose, createStore } from 'redux';
import type { Store } from 'redux';

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

const store: Store<*, Action> = createStore(
  rootReducer,
  undefined,
  compose(
    applyMiddleware(...middleware),
  ),
);

export const restore = (onFinished?: () => void) => {
    //persistStore(store, reduxPersistConfig, onFinished);

    ZulipAsyncStorage.getItem("reduxPersist:accounts", (err, v) => console.log(v));

    //const persistor = createPersistor(store, reduxPersistConfig);
    let paused = false;
    store.subscribe(() => {
	if (paused)
	    return;

	const key = 'reduxPersist:accounts';
	const value = store.getState().accounts;
	const serialized = JSON.stringify(value);
	ZulipAsyncStorage.setItem(key, serialized).catch((e) => {
	    console.warn('error in saving:', key, e);
	    throw e;
	});
    });

    paused = true;

    function complete () {
	paused = false;
	onFinished && onFinished();
    }

    setTimeout(async () => {
	const key = 'reduxPersist:accounts';
	let serialized;
	try {
	    serialized = await ZulipAsyncStorage.getItem(key);
	} catch (e) {
	    console.warn('error in restoring:', key, e);
	    complete();
	    throw e;
	}
	if (serialized == null) {
	    console.warn('error in restoring:', key, 'got', serialized);
	    complete();
	    return;
	}

	const data = JSON.parse(serialized);
	const state = {accounts: data};
	try {
	    store.dispatch({
		type: 'persist/REHYDRATE',
		payload: state,
		error: null,
	    });
	} finally {
	    complete();
	}
    });
}

export default store;
