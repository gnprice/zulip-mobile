/* @flow strict-local */
import { connect } from 'react-redux';

import React, { PureComponent } from 'react';
import { addNavigationHelpers } from 'react-navigation';
import type { NavigationAction } from 'react-navigation';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';

import type { Dispatch, GlobalState, NavigationState, PlainDispatch } from '../types';
import { getNav } from '../selectors';
import AppNavigator from './AppNavigator';

type Props = {|
  dispatch: Dispatch,
  nav: NavigationState,
|};

class AppWithNavigation extends PureComponent<Props> {
  dispatch = (a: NavigationAction) => {
    const dispatch = (this.props.dispatch: PlainDispatch);
    // $FlowFixMe flow-typed says react-navigation expects `dispatch` to return boolean
    return !!dispatch(a);
  };

  render() {
    const { nav } = this.props;

    const addListener = createReduxBoundAddListener('root');

    return (
      // $FlowFixMe-56 flow-typed object type is incompatible with statics of React.Component
      <AppNavigator
        navigation={addNavigationHelpers({
          state: nav,
          dispatch: this.dispatch,
          addListener,
        })}
      />
    );
  }
}

export default connect((state: GlobalState) => ({
  nav: getNav(state),
}))(AppWithNavigation);
