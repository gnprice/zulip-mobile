/* @flow strict-local */
import { connect } from 'react-redux';

import React, { PureComponent } from 'react';
import { StyleSheet } from 'react-native';

import type { Auth, GlobalState, Narrow, Stream, Dispatch } from '../types';
import { ZulipButton } from '../common';
import { markAllAsRead, markStreamAsRead, markTopicAsRead } from '../api';
import { getAuth, getStreams } from '../selectors';
import { caseNarrowDefault } from '../utils/narrow';

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    height: 32,
    paddingLeft: 12,
    paddingRight: 12,
  },
});

type Props = {|
  dispatch: Dispatch,
  auth: Auth,
  narrow: Narrow,
  streams: Stream[],
|};

class MarkUnreadButton extends PureComponent<Props> {
  handleMarkAllAsRead = () => {
    const { auth } = this.props;
    markAllAsRead(auth);
  };

  handleMarkStreamAsRead = () => {
    const { auth, narrow, streams } = this.props;
    const stream = streams.find(s => s.name === narrow[0].operand);
    if (stream) {
      markStreamAsRead(auth, stream.stream_id);
    }
  };

  handleMarkTopicAsRead = () => {
    const { auth, narrow, streams } = this.props;
    const stream = streams.find(s => s.name === narrow[0].operand);
    if (stream) {
      markTopicAsRead(auth, stream.stream_id, narrow[1].operand);
    }
  };

  render() {
    const type = caseNarrowDefault(
      this.props.narrow,
      {
        home: () => ({ text: 'Mark all as read', handler: this.handleMarkAllAsRead }),
        stream: () => ({ text: 'Mark stream as read', handler: this.handleMarkStreamAsRead }),
        topic: () => ({ text: 'Mark topic as read', handler: this.handleMarkTopicAsRead }),
      },
      () => null,
    );

    if (type === null) {
      return null;
    }
    const { text, handler } = type;
    return <ZulipButton style={styles.button} text={text} onPress={handler} />;
  }
}

export default connect((state: GlobalState) => ({
  auth: getAuth(state),
  streams: getStreams(state),
}))(MarkUnreadButton);
