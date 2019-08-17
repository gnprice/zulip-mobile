/* @flow strict-local */
import { NavigationActions } from 'react-navigation';

import type {
  Dispatch,
  NavigateAction,
  GetState,
  Message,
  Narrow,
  UserOrBot,
} from '../types';
import { getSameRoutesCount } from '../selectors';

export const navigateBack = () => (dispatch: Dispatch, getState: GetState): NavigateAction =>
  // $FlowFixMe
  dispatch(NavigationActions.pop({ n: getSameRoutesCount(getState()) }));
