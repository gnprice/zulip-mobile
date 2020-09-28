/* @flow strict-local */
import React from 'react';
import type {
  NavigationAction,
  NavigationState,
  NavigationContainer,
  NavigationContainerProps,
} from 'react-navigation';

const appContainerRef = React.createRef<
  NavigationContainer<NavigationState, { ... }, NavigationContainerProps<{ ... }, NavigationState>>,
>();

const getState = (): NavigationState => {
  if (appContainerRef.current === null) {
    throw new Error('Tried to use NavigationService before appContainerRef was set.');
  }
  return (
    // $FlowFixMe - how to tell Flow about `.state`?
    appContainerRef.current.state.nav
  );
};

const dispatch = (navigationAction: NavigationAction): boolean => {
  if (appContainerRef.current === null) {
    throw new Error('Tried to use NavigationService before appContainerRef was set.');
  }
  return (
    appContainerRef.current
      // $FlowFixMe - how to tell Flow about this method?
      .dispatch(navigationAction)
  );
};

export default {
  getState,
  dispatch,
  appContainerRef,
};
