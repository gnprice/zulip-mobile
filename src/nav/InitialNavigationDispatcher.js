/* @flow strict-local */
import type { Node as React$Node } from 'react';
import { PureComponent } from 'react';
import { StackActions, NavigationActions } from 'react-navigation';

import { connect } from '../react-redux';
import * as NavigationService from './NavigationService';
import getInitialRouteInfo from './getInitialRouteInfo';
import type { Dispatch, Account } from '../types';
import { getIsHydrated, hasAuth as getHasAuth, getHaveServerData } from '../selectors';

type SelectorProps = $ReadOnly<{|
  isHydrated: boolean,
  hasAuth: boolean,
  accounts: Account[],
  haveServerData: boolean,
|}>;

type Props = $ReadOnly<{|
  children: React$Node,

  dispatch: Dispatch,
  ...SelectorProps,
|}>;

class InitialNavigationDispatcher extends PureComponent<Props> {
  componentDidMount() {
    if (this.props.isHydrated) {
      // `NavigationService` will be ready by the time this is run: a
      // `ref` is set in the `ref`fed component's
      // `componentDidMount` [1], and a parent's `componentDidMount`
      // is run after a child's `componentDidMount` [2].
      //
      // [1] https://reactjs.org/docs/refs-and-the-dom.html#adding-a-ref-to-a-dom-element
      // [2] https://reactnavigation.org/docs/navigating-without-navigation-prop/#handling-initialization
      this.doInitialNavigation();
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isHydrated && this.props.isHydrated) {
      // `NavigationService` will be ready here (as long as the
      // `ref`fed component hasn't unmounted for some reason).
      // `componentDidUpdate` won't run before `componentDidMount`,
      // and we've established that it's ready by `componentDidMount`
      // (see note there).
      this.doInitialNavigation();
    }
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

export default connect(state => ({
  hasAuth: getHasAuth(state),
  accounts: state.accounts,
  haveServerData: getHaveServerData(state),
  isHydrated: getIsHydrated(state),
}))(InitialNavigationDispatcher);
