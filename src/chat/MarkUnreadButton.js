/* @flow strict-local */
import { connect } from 'react-redux';

import React, { PureComponent } from 'react';
import { StyleSheet } from 'react-native';

import type { Auth, GlobalState, Narrow, Stream, Dispatch } from '../types';
import { ZulipButton } from '../common';
import { markAllAsRead, markStreamAsRead, markTopicAsRead } from '../api';
import { getAuth, getStreams } from '../selectors';
import { caseNarrowDefault, caseNarrowPartial } from '../utils/narrow';

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
  onPress = () => {
    const { auth } = this.props;
    caseNarrowPartial(this.props.narrow, {
      home: () => {
        markAllAsRead(auth);
      },
      stream: name => {
        const stream = this.props.streams.find(s => s.name === name);
        if (stream) {
          markStreamAsRead(auth, stream.stream_id);
        }
      },
      topic: (streamName, topic) => {
        const stream = this.props.streams.find(s => s.name === streamName);
        if (stream) {
          markTopicAsRead(auth, stream.stream_id, topic);
        }
      },
    });
  };

  render() {
    const text = caseNarrowDefault(
      this.props.narrow,
      {
        home: () => 'Mark all as read',
        stream: () => 'Mark stream as read',
        topic: () => 'Mark topic as read',
      },
      () => null,
    );
    return text === null ? null : (
      <ZulipButton style={styles.button} text={text} onPress={this.onPress} />
    );
  }
}

export default connect((state: GlobalState) => ({
  auth: getAuth(state),
  streams: getStreams(state),
}))(MarkUnreadButton);
