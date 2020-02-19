/* @flow strict-local */

import React, { PureComponent } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import Color from 'color';

import type { Dimensions, Narrow, Orientation, ThemeName, Dispatch } from '../types';
import { connect } from '../react-redux';
import { foregroundColorFromBackground } from '../utils/color';
import { getSession, getSettings } from '../selectors';
import { getSubscriptionColorForNarrow } from '../subscriptions/subscriptionSelectors';

type BarStyle = $PropertyType<$PropertyType<StatusBar, 'props'>, 'barStyle'>;

export const getStatusBarColor = (backgroundColor: string, theme: ThemeName): string =>
  backgroundColor === 'transparent'
    ? theme === 'night'
      ? 'hsl(212, 28%, 18%)'
      : 'white'
    : backgroundColor;

export const getStatusBarStyle = (statusBarColor: string): BarStyle =>
  foregroundColorFromBackground(statusBarColor) === 'white' /* force newline */
    ? 'light-content'
    : 'dark-content';

type SelectorProps = $ReadOnly<{|
  orientation: Orientation,
  safeAreaInsets: Dimensions,
  subscriptionColor: string | null,

  theme: ThemeName,
|}>;

type Props = $ReadOnly<{
  backgroundColor?: string,
  narrow?: Narrow,
  hidden: boolean,

  dispatch: Dispatch,
  ...SelectorProps,
}>;

/**
 * Controls the status bar settings depending on platform
 * and current navigation position.
 * If narrowed to a stream or topic the color of the status bar
 * matches that of the stream.
 *
 * @prop [narrow] - Currently active narrow.
 */
class ZulipStatusBar extends PureComponent<Props> {
  static defaultProps = {
    hidden: false,
  };

  render() {
    const { theme, hidden, subscriptionColor, safeAreaInsets, orientation } = this.props;
    const backgroundColor = this.props.backgroundColor ?? subscriptionColor ?? 'transparent';
    const style = { height: hidden ? 0 : safeAreaInsets.top, backgroundColor };
    const statusBarColor = getStatusBarColor(backgroundColor, theme);
    return (
      orientation === 'PORTRAIT' && (
        <View style={style}>
          <StatusBar
            animated
            showHideTransition="slide"
            hidden={hidden && Platform.OS !== 'android'}
            backgroundColor={Color(statusBarColor).darken(0.1)}
            barStyle={getStatusBarStyle(statusBarColor)}
          />
        </View>
      )
    );
  }
}

export default connect<SelectorProps, _, _>((state, props) => ({
  orientation: getSession(state).orientation,
  safeAreaInsets: getSession(state).safeAreaInsets,
  subscriptionColor: props.narrow ? getSubscriptionColorForNarrow(state, props.narrow) : null,
  theme: getSettings(state).theme,
}))(ZulipStatusBar);
