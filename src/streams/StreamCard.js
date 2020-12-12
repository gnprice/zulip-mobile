/* @flow strict-local */
import React, { PureComponent } from 'react';
import { View } from 'react-native';

import type { Stream, Subscription } from '../types';
import styles, { createStyleSheet } from '../styles';
import { RawLabel } from '../common';
import StreamIcon from './StreamIcon';

const componentStyles = createStyleSheet({
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamText: {
    fontSize: 20,
  },
  descriptionText: {
    opacity: 0.8,
    marginTop: 16,
  },
  streamIcon: {
    marginRight: 8,
  },
});

type Props = $ReadOnly<{|
  stream: Stream,
  subscription: ?Subscription,
|}>;

export default class StreamCard extends PureComponent<Props> {
  render() {
    const { stream, subscription } = this.props;
    return (
      <View style={styles.padding}>
        <View style={componentStyles.streamRow}>
          <StreamIcon
            style={componentStyles.streamIcon}
            size={22}
            color={subscription?.color ?? 'gray'}
            isMuted={subscription ? !subscription.in_home_view : false}
            isPrivate={stream.invite_only}
          />
          <RawLabel
            style={componentStyles.streamText}
            text={stream.name}
            numberOfLines={1}
            ellipsizeMode="tail"
          />
        </View>
        {stream.description && (
          <RawLabel style={componentStyles.descriptionText} text={stream.description} />
        )}
      </View>
    );
  }
}
