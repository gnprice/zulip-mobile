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
  markAllAsRead = () => {
    const { auth } = this.props;
    api.markAllAsRead(auth);
  };

  markStreamAsRead = () => {
    const { auth, narrow } = this.props;
    if (!(narrow instanceof StreamNarrow)) {
      throw new Error('expected stream narrow');
    }
    api.markStreamAsRead(auth, narrow.streamId);
  };

  markTopicAsRead = () => {
    const { auth, narrow } = this.props;
    if (!(narrow instanceof TopicNarrow)) {
      throw new Error('expected topic narrow');
    }
    api.markTopicAsRead(auth, narrow.streamId, narrow.topic);
  };

  render() {
    const { narrow } = this.props;

    if (narrow instanceof AllMessagesNarrow) {
      return (
        <ZulipButton style={styles.button} text="Mark all as read" onPress={this.markAllAsRead} />
      );
    }

    if (narrow instanceof StreamNarrow) {
      return (
        <ZulipButton
          style={styles.button}
          text="Mark stream as read"
          onPress={this.markStreamAsRead}
        />
      );
    }

    if (narrow instanceof TopicNarrow) {
      return (
        <ZulipButton
          style={styles.button}
          text="Mark topic as read"
          onPress={this.markTopicAsRead}
        />
      );
    }

    return null;
  }
}

export default connect(state => ({
  auth: getAuth(state),
}))(MarkUnreadButton);
