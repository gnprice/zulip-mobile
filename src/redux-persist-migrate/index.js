/* @flow  */
import { REHYDRATE } from 'redux-persist/constants';
import { REHYDRATEE } from 'redux-persistt';
import type { RehydrateAction } from 'redux-persist';
import type { Reducer, Store, Dispatch } from 'redux';

import { logErrorRemotely } from '../utils/logging';

const processKey = key => {
  const int = parseInt(key, 10);
  if (Number.isNaN(int)) {
    throw new Error('redux-persist-migrate: migrations must be keyed with integer values');
  }
  return int;
};

type InnerStoreCreator<S, A, D> = (Reducer<S, A>, S | void) => Store<S, A, D>;
type StoreEnhancer<S, A, D> = (InnerStoreCreator<S, A, D>) => InnerStoreCreator<S, A, D>;

export default function createMigration<
  State,
  Action: { type: $Subtype<string>, payload: empty } | { type: typeof REHYDRATE, payload: State },
>(
  manifest: { [number]: (State) => State },
  versionSelector: string | (State => number | string | void),
  versionSetter?: (State, number) => State,
): StoreEnhancer<State, Action, Dispatch<Action>> {
  if (typeof versionSelector === 'string') {
    const reducerKey = versionSelector;
    // $FlowFixMe This is still a complicated DWIM, inherited from upstream.
    versionSelector = state => state && state[reducerKey] && state[reducerKey].version;
    versionSetter = (state, version) => {
      // $FlowFixMe state[reducerKey] isn't expressed in these types yet
      if (['undefined', 'object'].indexOf(typeof state[reducerKey]) === -1) {
        logErrorRemotely(
          new Error(
            'redux-persist-migrate: state for versionSetter key must be an object or undefined',
          ),
        );
        return state;
      }
      // $FlowFixMe state[reducerKey] isn't expressed in these types yet
      state[reducerKey] = state[reducerKey] || {};
      // $FlowFixMe state[reducerKey] isn't expressed in these types yet
      state[reducerKey].version = version;
      return state;
    };
  }

  const versionKeys = Object.keys(manifest)
    .map(processKey)
    .sort((a, b) => a - b);
  let currentVersion = versionKeys[versionKeys.length - 1];
  if (!currentVersion && currentVersion !== 0) {
    currentVersion = -1;
  }

  const migrate = (state, version) => {
    versionKeys.filter(v => v > version || version === null).forEach(v => {
      state = manifest[v](state);
    });

    if (versionSetter === undefined) {
      throw new Error('createMigration: bad arguments');
    }
    state = versionSetter(state, currentVersion);
    return state;
  };

  const migrationDispatch = next => (action: Action) => {
    if (versionSetter === undefined || typeof versionSelector === 'string') {
      throw new Error('createMigration: bad arguments');
    }
    if (action.type === REHYDRATE) {
      const incomingState = action.payload;
      const incomingVersion = parseInt(versionSelector(incomingState), 10);
      if (Number.isNaN(incomingVersion)) {
        // first launch after install, so incoming state is empty object
        // migration not required, just update version
        const payload = versionSetter(incomingState, currentVersion);
        return next({ ...action, type: REHYDRATE, payload });
      }

      if (incomingVersion !== currentVersion) {
        const migratedState = migrate(incomingState, incomingVersion);
        action.payload = migratedState;
      }
    }
    return next(action);
  };

  return next => (reducer, initialState) => {
    const store = next(reducer, initialState);
    return {
      ...store,
      dispatch: migrationDispatch(store.dispatch),
    };
  };
}
