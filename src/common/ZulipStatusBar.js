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

const StatusBarConfig = connectFlowFixMe(
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

const TopInsetSpacer = connectFlowFixMe(
  (state: GlobalState, props: { backgroundColor?: string, narrow?: Narrow }) => ({
    safeAreaInsets: getSession(state).safeAreaInsets,
    backgroundColor:
      props.backgroundColor !== undefined
        ? props.backgroundColor
        : getTitleBackgroundColor(props.narrow)(state),
    orientation: getSession(state).orientation,
  }),
)(TopInsetSpacerImpl);


type Props = {
  dispatch: Dispatch,
  narrow: Narrow,
  hidden: boolean,
  backgroundColor: string,
  orientation: Orientation,
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
    const { narrow, backgroundColor, hidden, orientation } = this.props;
    return (
      <View>
        <StatusBarConfig narrow={narrow} backgroundColor={backgroundColor} />
        {hidden ? (
          orientation === 'PORTRAIT' && Platform.OS !== 'android' && (
            <StatusBar hidden />
          )
        ) : (
          <TopInsetSpacer narrow={narrow} backgroundColor={backgroundColor} />
        )}
      </View>
    );
  }
}

export default connectFlowFixMe(
  (state: GlobalState) => ({
    orientation: getSession(state).orientation,
  }),
)(ZulipStatusBar);
