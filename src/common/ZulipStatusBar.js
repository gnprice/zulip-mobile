/* @flow strict-local */

import React, { PureComponent } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import Color from 'color';

import type { GlobalState, Narrow, ThemeName, Dispatch } from '../types';
import { connectFlowFixMe } from '../react-redux';
import { foregroundColorFromBackground } from '../utils/color';

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

type Props = {
  dispatch: Dispatch,
  hidden: boolean,
  backgroundColor: string,
};

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
    const { backgroundColor, hidden } = this.props;
    const style = { height: hidden ? 0 : 0, backgroundColor };
      const statusBarColor = 'white';
    return (
      true && (
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

export default connectFlowFixMe(
  (state: GlobalState, props: { backgroundColor?: string, narrow?: Narrow }) => ({
    backgroundColor:
      props.backgroundColor !== undefined
        ? props.backgroundColor
        : 'white'
  }),
)(ZulipStatusBar);
