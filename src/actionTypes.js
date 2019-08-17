/* @flow strict-local */
import type { NavigationNavigateAction } from 'react-navigation';

import {
  REHYDRATE,
  ACCOUNT_REMOVE,
  LOGIN_SUCCESS,
} from './actionConstants';

import type {
  GlobalState,
} from './types';

/**
 * Dispatched by redux-persist when the stored state is loaded.
 *
 * It can be very convenient to pass `payload` to selectors, but beware it's
 * incomplete.  At a minimum, reducers should always separately handle the
 * case where the state is empty or has `null` properties before passing the
 * object to any selector.
 *
 * @prop payload A version of the global Redux state, as persisted by the
 *     app's previous runs.  This will be empty on first startup or if the
 *     persisted store is just missing keys, and will have `null` at each
 *     key where an error was encountered in reading the persisted store.
 *     In any case it will only contain the keys we configure to be persisted.
 * @prop error
 */
type RehydrateAction = {|
  type: typeof REHYDRATE,
  payload: GlobalState | { accounts: null } | {||} | void,
  error: mixed,
|};

export type NavigateAction = NavigationNavigateAction;

type AccountRemoveAction = {|
  type: typeof ACCOUNT_REMOVE,
  index: number,
|};

type LoginSuccessAction = {|
  type: typeof LOGIN_SUCCESS,
  realm: string,
  email: string,
  apiKey: string,
|};


//
// The `Action` union type.
//

type AccountAction =
  | AccountRemoveAction
    | LoginSuccessAction;

type SessionAction =
    | RehydrateAction;

/** Covers all actions we ever `dispatch`. */
// The grouping here is completely arbitrary; don't worry about it.
export type Action =
  | AccountAction
    | SessionAction;
