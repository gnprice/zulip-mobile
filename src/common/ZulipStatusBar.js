/* @flow strict-local */

import React, { PureComponent } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import Color from 'color';

import type { Dimensions, Narrow, Orientation, Subscription, ThemeName, Dispatch } from '../types';
import { connect } from '../react-redux';
import { DEFAULT_TITLE_BACKGROUND_COLOR, titleBackgroundColor } from '../title/titleSelectors';
import { foregroundColorFromBackground } from '../utils/color';
import { getSession, getSettings } from '../selectors';
import {
  getSubscriptionsByName,
  getSubscriptionForNarrow,
} from '../subscriptions/subscriptionSelectors';

type BarStyle = $PropertyType<$PropertyType<StatusBar, 'props'>, 'barStyle'>;

export const getStatusBarColor = (backgroundColor: string, theme: ThemeName): string =>
  backgroundColor === DEFAULT_TITLE_BACKGROUND_COLOR
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
  subscription: Subscription | void,
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
    const { theme, hidden, narrow, subscriptionsByName, safeAreaInsets, orientation } = this.props;
    const backgroundColor =
      this.props.backgroundColor ?? titleBackgroundColor(narrow, subscriptionsByName);
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
  subscription: props.narrow && getSubscriptionForNarrow(state, props.narrow),
  theme: getSettings(state).theme,
}))(ZulipStatusBar);
