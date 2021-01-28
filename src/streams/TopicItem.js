/* @flow strict-local */
import React, { PureComponent } from 'react';
import { View } from 'react-native';

import styles, { BRAND_COLOR, createStyleSheet } from '../styles';
import { RawLabel, Touchable, UnreadCount } from '../common';
import { showToast } from '../utils/info';

const componentStyles = createStyleSheet({
  selectedRow: {
    backgroundColor: BRAND_COLOR,
  },
  label: {
    flex: 1,
  },
  selectedText: {
    color: 'white',
  },
  muted: {
    opacity: 0.5,
  },
});

type Props = $ReadOnly<{|
  streamName: string,
  name: string,
  isMuted: boolean,
  isSelected: boolean,
  unreadCount: number,
  onPress: (streamName: string, topic: string) => void,
|}>;

export default class TopicItem extends PureComponent<Props> {
  static defaultProps = {
    streamName: '',
    isMuted: false,
    isSelected: false,
    unreadCount: 0,
  };

  handlePress = () => {
    const { name, streamName, onPress } = this.props;
    onPress(streamName, name);
  };

  handleLongPress = () => {
    const { name } = this.props;
    showToast(name);
  };

  render() {
    const { name, isMuted, isSelected, unreadCount } = this.props;

    return (
      <Touchable onPress={this.handlePress} onLongPress={this.handleLongPress}>
        <View
          style={[
            styles.listItem,
            isSelected && componentStyles.selectedRow,
            isMuted && componentStyles.muted,
          ]}
        >
          <RawLabel
            style={[componentStyles.label, isSelected && componentStyles.selectedText]}
            text={name}
            numberOfLines={1}
            ellipsizeMode="tail"
          />
          <UnreadCount count={unreadCount} inverse={isSelected} />
        </View>
      </Touchable>
    );
  }
}
