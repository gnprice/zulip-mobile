/* @flow strict-local */
import React from 'react';
import { createAppContainer } from 'react-navigation';
import type {
  NavigationState,
  NavigationContainerProps,
  NavigationContainer,
} from 'react-navigation';

import * as NavigationService from './NavigationService';
import getInitialRouteInfo from './getInitialRouteInfo';
import { connect } from '../react-redux';
import type { Dispatch, Account } from '../types';
import { hasAuth as getHasAuth, getAccounts, getHaveServerData } from '../selectors';
import { createAppNavigator } from './AppNavigator';

type SelectorProps = {|
  hasAuth: boolean,
  accounts: Account[],
  haveServerData: boolean,
|};

type Props = $ReadOnly<{|
  ...SelectorProps,
  dispatch: Dispatch,
|}>;

/**
 * Wrapper for React Nav's component given by `createAppContainer`.
 *
 * Must be constructed after the store has been rehydrated.
 *
 * - Set `NavigationService`.
 *
 * - Call `createAppContainer` with the appropriate `initialRouteName`
 *   and `initialRouteParams` which we get from data in Redux.
 */
class ZulipAppContainer extends React.PureComponent<Props> {
  // (odd spacing choices)
  // eslint-disable-next-line
  AppContainer: NavigationContainer<
    NavigationState,
    { ... },
    NavigationContainerProps<{ ... }, NavigationState>,
  >;

  constructor(props: Props) {
    super(props);
    const { hasAuth, accounts, haveServerData } = this.props;
    this.AppContainer = createAppContainer<NavigationState, { ... }>(
      createAppNavigator(getInitialRouteInfo({ hasAuth, accounts, haveServerData })),
    );
  }

  render() {
    const { AppContainer } = this;
    return <AppContainer ref={NavigationService.appContainerRef} />;
  }
}

export default connect(state => ({
  hasAuth: getHasAuth(state),
  accounts: getAccounts(state),
  haveServerData: getHaveServerData(state),
}))(ZulipAppContainer);
