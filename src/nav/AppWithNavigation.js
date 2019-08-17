/* @flow strict-local */

import React, { PureComponent } from 'react';

import type { Dispatch, NavigationState } from '../types';
import { connect } from '../react-redux';
import AccountPickScreen from '../account/AccountPickScreen';
import LoadingScreen from '../start/LoadingScreen';

type Props = {|
  dispatch: Dispatch,
  nav: NavigationState,
|};

class AppWithNavigation extends PureComponent<Props> {
  render() {
      const { nav } = this.props;
      const route = nav;

      if (route === 'loading') {
	  return <LoadingScreen />;
      } else {
	  return <AccountPickScreen />;
      }
  }
}

export default connect(state => ({
    nav: state.nav,
}))(AppWithNavigation);
