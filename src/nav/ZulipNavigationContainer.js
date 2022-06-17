/* @flow strict-local */
import React, { useContext, useEffect } from 'react';
import type { Node } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import type { NavigationContainerOf } from '@react-navigation/native/lib/typescript/src/NavigationContainer';

import { useGlobalSelector } from '../react-redux';
import { ThemeContext } from '../styles';
import * as NavigationService from './NavigationService';
import { getGlobalSettings } from '../selectors';
import AppNavigator from './AppNavigator';
import type { AppNavigatorParamList } from './AppNavigator';

type Props = $ReadOnly<{||}>;

const AppNavigationContainer: NavigationContainerOf<AppNavigatorParamList> = NavigationContainer;

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
export default function ZulipAppContainer(props: Props): Node {
  const themeName = useGlobalSelector(state => getGlobalSettings(state).theme);

  useEffect(
    () =>
      // return a cleanup function:
      //   https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1
      () => {
        NavigationService.isReadyRef.current = false;
      },
    [],
  );

  const themeContext = useContext(ThemeContext);

  const BaseTheme = themeName === 'night' ? DarkTheme : DefaultTheme;

  const theme = {
    ...BaseTheme,
    dark: themeName === 'night',
    colors: {
      ...BaseTheme.colors,
      primary: themeContext.color,
      background: themeContext.backgroundColor,
      card: themeContext.cardColor,
      border: themeContext.dividerColor,
    },
  };

  return (
    <AppNavigationContainer
      /* $FlowIssue[incompatible-type] This gets an error that simplifies down to:
(c: React$ElementRef<NavigationContainerOf<AppNavigatorParamList>>
 ): React$ElementRef<NavigationContainerOf<AppNavigatorParamList>> => c; // error here
       */
      ref={NavigationService.navigationContainerRef}
      onReady={() => {
        NavigationService.isReadyRef.current = true;
      }}
      theme={theme}
    >
      <AppNavigator />
    </AppNavigationContainer>
  );
}
