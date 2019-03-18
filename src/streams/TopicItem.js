/* @flow strict-local */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';

import styles from '../styles';
import { RawLabel, Touchable, UnreadCount } from '../common';

const componentStyles = StyleSheet.create({
  label: {
    flex: 1,
  },
  muted: {
    opacity: 0.5,
  },
});

type Props = {|
  stream: string,
  name: string,
  isMuted: boolean,
  unreadCount: number,
  onPress: (topic: string, stream: string) => void,
|};

export default class TopicItem extends PureComponent<Props> {
  static defaultProps = {
    stream: '',
    isMuted: false,
    unreadCount: 0,
  };

  handlePress = () => {
    const { name, stream, onPress } = this.props;
    onPress(stream, name);
  };

  render() {
    const { name, isMuted, unreadCount } = this.props;

    return (
      <Touchable onPress={this.handlePress}>
        <View style={[styles.listItem, isMuted && componentStyles.muted]}>
          <RawLabel
            style={[componentStyles.label]}
            text={name}
            numberOfLines={1}
            ellipsizeMode="tail"
          />
          <UnreadCount count={unreadCount} />
        </View>
      </Touchable>
    );
  }
}
