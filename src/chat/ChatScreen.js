/* @flow strict-local */
import React, { PureComponent } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import type { Context, Dispatch, Narrow } from '../types';
import { connect } from '../react-redux';
import { OfflineNotice, ZulipStatusBar } from '../common';
import Chat from './Chat';
import ChatNavBar from '../nav/ChatNavBar';
import { getSubscriptionColorForNarrow } from '../subscriptions/subscriptionSelectors';

type SelectorProps = $ReadOnly<{|
  subscriptionColor: string | null,
|}>;

type Props = $ReadOnly<{|
  navigation: NavigationScreenProp<{ params: {| narrow: Narrow |} }>,

  dispatch: Dispatch,
  ...SelectorProps,
|}>;

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
    const { subscriptionColor } = this.props;
    const { narrow } = this.props.navigation.state.params;

    return (
      <ActionSheetProvider>
        <View style={[contextStyles.screen, styles.reverse]}>
          <Chat narrow={narrow} />
          <OfflineNotice />
          <ChatNavBar narrow={narrow} subscriptionColor={subscriptionColor} />
          <ZulipStatusBar backgroundColor={subscriptionColor ?? undefined} />
        </View>
      </ActionSheetProvider>
    );
  }
}

export default connect<SelectorProps, _, _>((state, props) => ({
  subscriptionColor: getSubscriptionColorForNarrow(state, props.navigation.state.params.narrow),
}))(ChatScreen);
