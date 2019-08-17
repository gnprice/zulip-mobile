/* @flow strict-local */

import React, { PureComponent } from 'react';
import type { Node as React$Node } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import type { ViewStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

import type { Context, AccountsState, Dimensions, LocalizableText, Dispatch } from '../types';
import { connect } from '../react-redux';
import KeyboardAvoider from './KeyboardAvoider';
import OfflineNotice from './OfflineNotice';
import ZulipStatusBar from './ZulipStatusBar';
import { getSession } from '../selectors';
import ModalNavBar from '../nav/ModalNavBar';
import styles from '../styles';

const componentStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  childrenWrapper: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

type Props = {|
  dispatch: Dispatch,
  centerContent: boolean,
	      +children: React$Node,
	      accounts: AccountsState,
  safeAreaInsets: Dimensions,
  keyboardShouldPersistTaps: 'never' | 'always' | 'handled',
  padding: boolean,
  scrollEnabled: boolean,
  style?: ViewStyleProp,

  search: boolean,
  autoFocus: boolean,
  searchBarOnChange: (text: string) => void,

  canGoBack: boolean,
  +title: LocalizableText,
|};

/**
 * Wrapper component for each screen of the app, for consistent look-and-feel.
 *
 * Provides a nav bar, colors the status bar, can center the contents, etc.
 * The `children` are ultimately wrapped in a `ScrollView` from upstream.
 *
 * @prop [centerContent] - Should the contents be centered.
 * @prop children - Components to render inside the screen.
 * @prop [keyboardShouldPersistTaps] - Passed through to ScrollView.
 * @prop [padding] - Should padding be added to the contents of the screen.
 * @prop [scrollEnabled] - Passed through to ScrollView.
 * @prop [style] - Additional style for the ScrollView.
 *
 * @prop [search] - If 'true' show a search box in place of the title.
 * @prop [autoFocus] - If search bar enabled, should it be focused initially.
 * @prop [searchBarOnChange] - Event called on search query change.
 *
 * @prop [canGoBack] - If true (the default), show UI for "navigate back".
 * @prop [title] - Text shown as the title of the screen.
 *                 Required unless `search` is true.
 */
class Screen extends PureComponent<Props> {
  context: Context;

  static contextTypes = {
    styles: () => null,
  };

  static defaultProps = {
    centerContent: false,
    keyboardShouldPersistTaps: 'handled',
    padding: false,
    scrollEnabled: true,

    search: false,
    autoFocus: false,
    searchBarOnChange: (text: string) => {},

    canGoBack: true,
    title: '',
  };

  render() {
    const {
      canGoBack,
      centerContent,
      children,
      keyboardShouldPersistTaps,
      padding,
      safeAreaInsets,
      scrollEnabled,
      style,
      title,
    } = this.props;
    const { styles: contextStyles } = this.context;

      const realms = this.props.accounts.map(a => a.realm);
      const info = `[${realms.join(', ')}]`;
      // $FlowFixMe
      const bigtitle = `${title} ${info}`;

    return (
      <View style={[contextStyles.screen, { paddingBottom: safeAreaInsets.bottom }]}>
        <ZulipStatusBar />
        <ModalNavBar canGoBack={canGoBack} title={bigtitle} />
        <OfflineNotice />
        <KeyboardAvoider
          behavior="padding"
          style={[componentStyles.wrapper, padding && styles.padding]}
          contentContainerStyle={[padding && styles.padding]}
        >
          <ScrollView
            contentContainerStyle={[styles.flexed, centerContent && componentStyles.content, style]}
            style={componentStyles.childrenWrapper}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            scrollEnabled={scrollEnabled}
          >
            {children}
          </ScrollView>
        </KeyboardAvoider>
      </View>
    );
  }
}

export default connect(state => ({
    accounts: state.accounts,
  safeAreaInsets: getSession(state).safeAreaInsets,
}))(Screen);
