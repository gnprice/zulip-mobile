/* @flow strict-local */
import React, { PureComponent } from 'react';
import type { Node } from 'react';
import { View } from 'react-native';

import type { Narrow } from '../types';
import { createStyleSheet } from '../styles';
import { Label } from '../common';
import { showComposeBoxOnNarrow, caseNarrowDefault } from '../utils/narrow';

const styles = createStyleSheet({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    paddingLeft: 10,
    padding: 8,
  },
});

type Props = $ReadOnly<{|
  narrow: Narrow,
|}>;

export default class NoMessages extends PureComponent<Props> {
  render(): Node {
    const { narrow } = this.props;

    const text = caseNarrowDefault(
      narrow,
      {
        home: () => 'No messages on server',
        stream: () => 'No messages in stream',
        topic: () => 'No messages with this topic',
        pm: ids =>
          ids.length === 1 ? 'No messages with this person' : 'No messages in this group',
      },
      () => 'No messages',
    );

    return (
      <View style={styles.container}>
        <Label style={styles.text} text={text} />
        {showComposeBoxOnNarrow(narrow) ? <Label text="Why not start the conversation?" /> : null}
      </View>
    );
  }
}
