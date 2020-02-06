/* @flow strict-local */

import React, { PureComponent } from 'react';
import { StyleSheet } from 'react-native';

import type { Auth, Dispatch } from '../types';
import { connect } from '../react-redux';
import { ZulipButton } from '../common';
import * as api from '../api';
import { getAuth } from '../selectors';
import { CleanNarrow, StreamNarrow, TopicNarrow, AllMessagesNarrow } from '../utils/narrow';

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    height: 32,
    paddingLeft: 12,
    paddingRight: 12,
  },
});

type Props = $ReadOnly<{|
  dispatch: Dispatch,
  auth: Auth,
  narrow: CleanNarrow,
|}>;

class MarkUnreadButton extends PureComponent<Props> {
  onPress = () => {
    const { auth, narrow } = this.props;
    if (narrow instanceof AllMessagesNarrow) {
      api.markAllAsRead(auth);
    } else if (narrow instanceof StreamNarrow) {
      api.markStreamAsRead(auth, narrow.streamId);
    } else if (narrow instanceof TopicNarrow) {
      api.markTopicAsRead(auth, narrow.streamId, narrow.topic);
    }
  };

  render() {
    const { narrow } = this.props;
    const text =
      narrow instanceof AllMessagesNarrow
        ? 'Mark all as read'
        : narrow instanceof StreamNarrow
        ? 'Mark stream as read'
        : narrow instanceof TopicNarrow
        ? 'Mark topic as read'
        : null;

    return text && <ZulipButton text={text} style={styles.button} onPress={this.onPress} />;
  }
}

export default connect(state => ({
  auth: getAuth(state),
}))(MarkUnreadButton);
