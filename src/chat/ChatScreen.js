/* @flow strict-local */
import React, { PureComponent } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import type { Context, Narrow } from '../types';
import { OfflineNotice, ZulipStatusBar } from '../common';
import { getTitleBackgroundColor } from '../selectors';
import Chat from './Chat';
import ChatNavBar from '../nav/ChatNavBar';

type Props = {|
  backgroundColor: string,
  navigation: NavigationScreenProp<{ params: {| narrow: Narrow |} }>,
|};

const styles = StyleSheet.create({
  /** A workaround for #3089, by letting us put Chat (with MessageList) first. */
  reverse: {
    flexDirection: 'column-reverse',
  },
});

class ChatScreen extends PureComponent<Props> {
  context: Context;

  static contextTypes = {
    styles: () => null,
  };

  render() {
    const { styles: contextStyles } = this.context;
    const { narrow } = this.props.navigation.state.params;
    const { backgroundColor } = this.props;

    return (
      <ActionSheetProvider>
        <SafeAreaView style={[contextStyles.screen, styles.reverse, { backgroundColor }]}>
          <Chat narrow={narrow} />
          <OfflineNotice />
          <ChatNavBar narrow={narrow} />
          <ZulipStatusBar narrow={narrow} />
        </SafeAreaView>
      </ActionSheetProvider>
    );
  }
}

export default connect((state, props) => ({
  backgroundColor: getTitleBackgroundColor(props.navigation.state.params.narrow)(state),
}))(ChatScreen);
