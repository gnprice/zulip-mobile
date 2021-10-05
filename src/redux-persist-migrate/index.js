/* @flow strict-local */
import type { Dispatch, StoreEnhancer } from 'redux';

import { REHYDRATE } from '../actionConstants';
import type { Action, GlobalState as State } from '../types';
import * as logging from '../utils/logging';

const processKey = key => {
  const int = parseInt(key, 10);
  if (Number.isNaN(int)) {
    throw new Error('redux-persist-migrate: migrations must be keyed with integer values');
  }
  return int;
};

/* eslint-disable no-use-before-define */

// A general version of this would want some type variables like:
//   `VersionKey: string, State: { [VersionKey]: {| version?: number |}, ... }`
// We just hardcode 'migrations' and use our GlobalState, which satisfies that.
export default function createMigration(
  manifest: {| [string]: (State) => State |},
  versionSelector: 'migrations',
  versionSetter?: (State, number) => State,
): StoreEnhancer<State, Action, Dispatch<Action>> {
  const reducerKey = versionSelector;
  const realVersionSelector = state => state && state[reducerKey] && state[reducerKey].version;
  const realVersionSetter = (state, version) => {
    if (['undefined', 'object'].indexOf(typeof state[reducerKey]) === -1) {
      logging.error(
        'redux-persist-migrate: state for versionSetter key must be an object or undefined',
        { version, reducerKey, 'actual-state': state[reducerKey] },
      );
      return state;
    }
    // $FlowFixMe[incompatible-cast] TODO MigrationsState should probably say number?
    return { ...state, [reducerKey]: { version: (version: string) } };
  };
  return createMigrationImpl(manifest, realVersionSelector, realVersionSetter);
}

function createMigrationImpl(
  manifest: {| [string]: (State) => State |},
  versionSelector: State => number | string | void,
  versionSetter: (State, number) => State,
): StoreEnhancer<State, Action, Dispatch<Action>> {
  const versionKeys = Object.keys(manifest)
    .map(processKey)
    .sort((a, b) => a - b);
  let currentVersion = versionKeys[versionKeys.length - 1];
  if (!currentVersion && currentVersion !== 0) {
    currentVersion = -1;
  }

  const migrate = (state, version) => {
    let newState = state;
    versionKeys
      .filter(v => v > version || version === null)
      .forEach(v => {
        newState = manifest[v.toString()](newState);
      });

    newState = versionSetter(newState, currentVersion);
    return newState;
  };

  const migrationDispatch = next => (action: Action) => {
    if (versionSetter === undefined || typeof versionSelector === 'string') {
      throw new Error('createMigration: bad arguments');
    }
    if (action.type === REHYDRATE) {
      /* $FlowIgnore[incompatible-type]
         this really is a lie -- and kind of central to migration */
      const incomingState: State = action.payload;
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
