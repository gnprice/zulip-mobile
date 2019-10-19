/* @flow strict-local */

import React, { PureComponent } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import Color from 'color';

import type { Dimensions, GlobalState, Narrow, Orientation, ThemeName, Dispatch } from '../types';
import { connectFlowFixMe } from '../react-redux';
import { DEFAULT_TITLE_BACKGROUND_COLOR, getTitleBackgroundColor } from '../title/titleSelectors';
import { foregroundColorFromBackground } from '../utils/color';
import { getSession, getSettings } from '../selectors';

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

type StatusBarConfigProps = {|
  dispatch: Dispatch,
  narrow: Narrow,
  theme: ThemeName,
  backgroundColor: string,
|};

class StatusBarConfigImpl extends PureComponent<StatusBarConfigProps> {
  render() {
    const { theme, backgroundColor } = this.props;
    const statusBarColor = getStatusBarColor(backgroundColor, theme);
    return (
      <StatusBar
        animated
        showHideTransition="slide"
        backgroundColor={Color(statusBarColor).darken(0.1)}
        barStyle={getStatusBarStyle(statusBarColor)}
      />
    );
  }
}

export const StatusBarConfig = connectFlowFixMe(
  (state: GlobalState, props: { backgroundColor?: string, narrow?: Narrow }) => ({
    theme: getSettings(state).theme,
    backgroundColor:
      props.backgroundColor !== undefined
        ? props.backgroundColor
        : getTitleBackgroundColor(props.narrow)(state),
  }),
)(StatusBarConfigImpl);


type TopInsetSpacerProps = {|
  dispatch: Dispatch,
  backgroundColor: string,
  safeAreaInsets: Dimensions,
  orientation: Orientation,
|};

class TopInsetSpacerImpl extends PureComponent<TopInsetSpacerProps> {
  render() {
    const { backgroundColor, safeAreaInsets, orientation } = this.props;
    const style = { height: safeAreaInsets.top, backgroundColor };
    return orientation === 'PORTRAIT' && (
      <View style={style} />
    );
  }
}

export const TopInsetSpacer = connectFlowFixMe(
  (state: GlobalState, props: { backgroundColor?: string, narrow?: Narrow }) => ({
    safeAreaInsets: getSession(state).safeAreaInsets,
    backgroundColor:
      props.backgroundColor !== undefined
        ? props.backgroundColor
        : getTitleBackgroundColor(props.narrow)(state),
    orientation: getSession(state).orientation,
  }),
)(TopInsetSpacerImpl);


export const MaybeHideStatusBar = connectFlowFixMe(
  state => ({
    orientation: getSession(state).orientation,
  }),
)(class extends PureComponent<{| orientation: Orientation |}> {

  render() {
    const { orientation } = this.props;
    return (
      orientation === 'PORTRAIT' && Platform.OS !== 'android' && (
        <StatusBar hidden />
      )
    );
  }
});
