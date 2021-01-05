/* @flow strict-local */
import type { Node as React$Node } from 'react';
import React, { PureComponent } from 'react';
import { StackActions, NavigationActions, createAppContainer } from 'react-navigation';
import type {
  NavigationState,
  NavigationContainerProps,
  NavigationContainer,
} from 'react-navigation';

import { connect } from '../react-redux';
import * as NavigationService from './NavigationService';
import getInitialRouteInfo from './getInitialRouteInfo';
import type { Dispatch, Account } from '../types';
import { hasAuth as getHasAuth, getAccounts, getHaveServerData } from '../selectors';
import { createAppNavigator } from './AppNavigator';

type SelectorProps = $ReadOnly<{|
  hasAuth: boolean,
  accounts: Account[],
  haveServerData: boolean,
|}>;

type Props = $ReadOnly<{|
  children: React$Node,

  dispatch: Dispatch,
  ...SelectorProps,
|}>;

class InitialNavigationDispatcherInner extends PureComponent<Props> {
  componentDidMount() {
    // `NavigationService` will be ready by the time this is run: a
    // `ref` is set in the `ref`fed component's
    // `componentDidMount` [1], and a parent's `componentDidMount`
    // is run after a child's `componentDidMount` [2].
    //
    // [1] https://reactjs.org/docs/refs-and-the-dom.html#adding-a-ref-to-a-dom-element
    // [2] https://reactnavigation.org/docs/navigating-without-navigation-prop/#handling-initialization
    this.doInitialNavigation();
  }

  /**
   * Data has been loaded, so open the app to the right screen.
   *
   * Not to be called before the REHYDRATE action or before
   * `NavigationService` is ready, and not to be called more than
   * once.
   */
  doInitialNavigation = () => {
    const { hasAuth, accounts, haveServerData } = this.props;

    const { initialRouteName, initialRouteParams } = getInitialRouteInfo({
      accounts,
      hasAuth,
      haveServerData,
    });

    if (initialRouteName === 'loading') {
      // We're already on the loading screen -- see `initialRouteName`
      // in `AppNavigator`.
      return;
    }

    NavigationService.dispatch(
      StackActions.reset({
        index: 0,
        actions: [
          NavigationActions.navigate({
            routeName: initialRouteName,
            params: initialRouteParams,
          }),
        ],
      }),
    );
  };

  render() {
    return this.props.children;
  }
}

export const InitialNavigationDispatcher = connect(state => ({
  hasAuth: getHasAuth(state),
  accounts: getAccounts(state),
  haveServerData: getHaveServerData(state),
}))(InitialNavigationDispatcherInner);

export class ZulipAppContainer extends React.PureComponent<{||}> {
  // (odd spacing choices)
  // eslint-disable-next-line
  AppContainer: NavigationContainer<
    NavigationState,
    { ... },
    NavigationContainerProps<{ ... }, NavigationState>,
  >;

  constructor(props: {||}) {
    super(props);
    this.AppContainer = createAppContainer<NavigationState, { ... }>(
      createAppNavigator({ initialRouteName: 'loading' }),
    );
  }

  render() {
    const { AppContainer } = this;
    return <AppContainer ref={NavigationService.appContainerRef} />;
  }
}
