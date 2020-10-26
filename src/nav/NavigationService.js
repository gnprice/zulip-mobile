/* @flow strict-local */
import React from 'react';
import type {
  NavigationAction,
  NavigationState,
  NavigationContainer,
  NavigationContainerProps,
} from 'react-navigation';

/* prettier-ignore */
const appContainerRef = React.createRef<
  React$ElementRef<
    NavigationContainer<
      NavigationState,
      { ... },
      NavigationContainerProps<{ ... }, NavigationState>>>
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
  return appContainerRef.current.dispatch(navigationAction);
};

export default {
  getState,
  dispatch,
  appContainerRef,
};
