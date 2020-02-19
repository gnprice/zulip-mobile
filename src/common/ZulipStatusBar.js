/* @flow strict-local */

import React, { PureComponent } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import Color from 'color';

import type { Dimensions, Orientation, ThemeName, Dispatch } from '../types';
import { connect } from '../react-redux';
import { foregroundColorFromBackground } from '../utils/color';
import { getSession, getSettings } from '../selectors';

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
  safeAreaInsets: Dimensions,
  theme: ThemeName,
  orientation: Orientation,
|}>;

type Props = $ReadOnly<{
  backgroundColor?: string,
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
    const { theme, hidden, safeAreaInsets, orientation } = this.props;
    const backgroundColor = this.props.backgroundColor ?? 'transparent';
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
  safeAreaInsets: getSession(state).safeAreaInsets,
  theme: getSettings(state).theme,
  orientation: getSession(state).orientation,
}))(ZulipStatusBar);
