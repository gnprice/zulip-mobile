/**
 * Types describing our Redux state and store.
 *
 * This isn't the place for types that are borrowed from the API;
 * those go under `src/api/` (typically in `src/api/modelTypes.js`)
 * and can be imported here as needed.
 *
 * @flow strict-local
 */

import type { InputSelector } from 'reselect';

import type { Action, NavigateAction } from './actionTypes';

export type * from './actionTypes';

export type ThemeName = 'default' | 'night';

export type AccountsState = {| realm: string |}[];

export type MigrationsState = {|
  version?: string,
|};

export type NavigationState = string;

/**
 * Our complete Redux state tree.
 *
 * Each property is a subtree maintained by its own reducer function.
 */
export type GlobalState = {|
  accounts: AccountsState,
  migrations: MigrationsState,
  nav: NavigationState,
|};

/** A selector returning TResult, with extra parameter TParam. */
// Seems like this should be OutputSelector... but for whatever reason,
// putting that on a selector doesn't cause the result type to propagate to
// the corresponding parameter when used in `createSelector`, and this does.
export type Selector<TResult, TParam = void> = InputSelector<GlobalState, TParam, TResult>;

export type GetState = () => GlobalState;

export type PlainDispatch = <A: Action | NavigateAction>(action: A) => A;

export interface Dispatch {
  <A: Action | NavigateAction>(action: A): A;
  <T>((Dispatch, GetState) => T): T;
}
