/* @flow strict-local */

/* eslint-disable no-use-before-define */

import type { Action as GenericAction, Middleware } from 'redux';

type Action = GenericAction<mixed>;

export interface ThunkDispatch<S, E, A: Action> {
  <T: A>(action: T): T;
  <R>(asyncAction: ThunkAction<R, S, E, A>): R;
}

export type ThunkAction<R, S, E, A: Action> = (
  dispatch: ThunkDispatch<S, E, A>,
  getState: () => S,
  extraArgument: E,
) => R;

export type ThunkMiddleware<S = {}, A: Action = Action, E = void> = Middleware<
  S,
  A,
  ThunkDispatch<S, E, A>,
>;

function createThunkMiddleware<S = {}, A: Action = Action, E = void>(
  extraArgument: E,
): ThunkMiddleware<S, A, E> {
  return ({ dispatch, getState }) => (next: ThunkDispatch<S, E, A>): ThunkDispatch<S, E, A> =>
    // $FlowFixMe[incompatible-return]: overload seems tricky; also returning action is silly
    function inner<R>(action: A | ThunkAction<R, S, E, A>): R {
      if (typeof action === 'function') {
        return action(dispatch, getState, extraArgument);
      }

      return (next(action): $FlowFixMe); // returning the action is silly
    };
}

const thunk = createThunkMiddleware();
// thunk.withExtraArgument = createThunkMiddleware;

export default (thunk: mixed);
