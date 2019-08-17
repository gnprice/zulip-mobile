/* @flow strict-local */
import type { NavigationState, Action } from '../types';
import {
  REHYDRATE,
  LOGIN_SUCCESS,
} from '../actionConstants';

/**
 * Get the initial state for the given route.
 *
 * Private; exported only for tests.
 */
export const getStateForRoute = (route: string): NavigationState => {
    return route;
};

const initialState = getStateForRoute('loading');

export default (state: NavigationState = initialState, action: Action): NavigationState => {
  switch (action.type) {
    case REHYDRATE:
    case LOGIN_SUCCESS:
      return getStateForRoute('account');

    default:
      return state;
  }
};
