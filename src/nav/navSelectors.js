/* @flow strict-local */
import type { GlobalState, NavigationState } from '../types';

export const getNav = (state: GlobalState): NavigationState => state.nav;
