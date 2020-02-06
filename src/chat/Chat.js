/* @flow strict-local */
import React, { PureComponent } from 'react';
import { View, StyleSheet } from 'react-native';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { KeyboardAvoider } from '../common';
import MessageList from '../webview/MessageList';
import NoMessages from '../message/NoMessages';
import ComposeBox from '../compose/ComposeBox';
import UnreadNotice from './UnreadNotice';
import styles from '../styles';
import { canSendToNarrow, asApiStringNarrow, DualNarrow } from '../utils/narrow';
import { getShowMessagePlaceholders } from '../selectors';

type SelectorProps = {|
  canSend: boolean,
|};

type Props = $ReadOnly<{|
  narrow: DualNarrow<>,

  dispatch: Dispatch,
  ...SelectorProps,
|}>;

const componentStyles = StyleSheet.create({
  /** A workaround for #3089, by letting us put MessageList first. */
  reverse: {
    flex: 1,
    flexDirection: 'column-reverse',
  },
});

class Chat extends PureComponent<Props> {
  render() {
    const { canSend, narrow } = this.props;

    return (
      <KeyboardAvoider style={styles.flexed} behavior="padding">
        <View style={styles.flexed}>
          <View style={componentStyles.reverse}>
            <MessageList narrow={narrow.strings} />
            <NoMessages narrow={narrow.strings} />
            <UnreadNotice narrow={narrow} />
          </View>
          {canSend && <ComposeBox narrow={narrow} />}
        </View>
      </KeyboardAvoider>
    );
  }
}

export default connect<SelectorProps, _, _>((state, props) => {
  const narrow = asApiStringNarrow(props.narrow);
  return {
    canSend: canSendToNarrow(narrow) && !getShowMessagePlaceholders(narrow)(state),
  };
})(Chat);
