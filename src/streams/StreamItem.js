/* @flow strict-local */
import React, { useContext } from 'react';
import type { Node } from 'react';
import { View } from 'react-native';
// $FlowFixMe[untyped-import]
import { useActionSheet } from '@expo/react-native-action-sheet';

import type { Stream, Subscription } from '../types';
import { showStreamActionSheet } from '../action-sheets';
import type { ShowActionSheetWithOptions } from '../action-sheets';
import { TranslationContext } from '../boot/TranslationProvider';
import { useDispatch, useSelector } from '../react-redux';
import {
  getAuth,
  getFlags,
  getSubscriptionsById,
  getStreamsById,
  getOwnUser,
  getSettings,
} from '../selectors';
import styles, { createStyleSheet, ThemeContext } from '../styles';
import { ZulipText, Touchable, UnreadCount, ZulipSwitch } from '../common';
import { foregroundColorFromBackground } from '../utils/color';
import StreamIcon from './StreamIcon';

const componentStyles = createStyleSheet({
  description: {
    opacity: 0.75,
    fontSize: 12,
  },
  text: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 8,
  },
  muted: {
    opacity: 0.5,
  },
});

type PseudoSubscription = Subscription | $ReadOnly<{ ...Stream, color?: void }>;

type Props = $ReadOnly<{|
  subscription: PseudoSubscription,

  isMuted: boolean,
  isSubscribed?: boolean,

  unreadCount?: number,
  iconSize: number,
  highlight?: boolean,
  showDescription?: boolean,
  showSwitch?: boolean,
  onPress: (streamId: number, streamName: string) => void,
  onSwitch?: (streamId: number, streamName: string, newValue: boolean) => void,
|}>;

/**
 * A single-line list item to show a stream or stream subscription.
 *
 * Many of the props must correspond to certain properties of a Stream or
 * Subscription.
 *
 * @prop isMuted - false for a Stream; !sub.in_home_view for Subscription
 * @prop isSubscribed - whether the user is subscribed to the stream;
 *   ignored (and can be any value) unless showSwitch is true
 * @prop color - if provided, MUST be .color on a Subscription
 *
 * @prop unreadCount - number of unread messages
 * @prop iconSize
 * @prop showSwitch - whether to show a toggle switch (ZulipSwitch)
 * @prop onPress - press handler for the item; receives the stream name
 * @prop onSwitch - if switch exists; receives stream name and new value
 */
export default function StreamItem(props: Props): Node {
  const {
    subscription,
    isMuted,
    isSubscribed = false,
    iconSize,
    highlight = false,
    showDescription = false,
    showSwitch = false,
    unreadCount,
    onPress,
    onSwitch,
  } = props;

  const showActionSheetWithOptions: ShowActionSheetWithOptions = useActionSheet()
    .showActionSheetWithOptions;
  const _ = useContext(TranslationContext);
  const dispatch = useDispatch();
  const backgroundData = useSelector(state => ({
    auth: getAuth(state),
    ownUser: getOwnUser(state),
    streams: getStreamsById(state),
    subscriptions: getSubscriptionsById(state),
    flags: getFlags(state),
    userSettingStreamNotification: getSettings(state).streamNotification,
  }));

  const { backgroundColor: themeBackgroundColor, color: themeColor } = useContext(ThemeContext);

  const streamColor = subscription.color ?? undefined;
  const wrapperStyle = [
    styles.listItem,
    { backgroundColor: highlight ? streamColor : undefined },
    isMuted && componentStyles.muted,
  ];
  const iconColor =
    !highlight && streamColor != null
      ? streamColor
      : foregroundColorFromBackground(
          // $FlowFixMe invariant: highlight => have sub, with color
          highlight ? streamColor : themeBackgroundColor,
        );
  // $FlowFixMe invariant: highlight => have sub, with color
  const textColor = highlight ? (foregroundColorFromBackground(streamColor): string) : themeColor;

  return (
    <Touchable
      onPress={() => onPress(subscription.stream_id, subscription.name)}
      onLongPress={() => {
        showStreamActionSheet({
          showActionSheetWithOptions,
          callbacks: { dispatch, _ },
          backgroundData,
          streamId: subscription.stream_id,
        });
      }}
    >
      <View style={wrapperStyle}>
        <StreamIcon
          size={iconSize}
          color={iconColor}
          isMuted={isMuted}
          isPrivate={subscription.invite_only}
          isWebPublic={subscription.is_web_public}
        />
        <View style={componentStyles.text}>
          <ZulipText
            numberOfLines={1}
            style={{ color: textColor }}
            text={subscription.name}
            ellipsizeMode="tail"
          />
          {showDescription && (
            <ZulipText
              numberOfLines={1}
              style={componentStyles.description}
              text={subscription.description}
              ellipsizeMode="tail"
            />
          )}
        </View>
        <UnreadCount color={iconColor} count={unreadCount} />
        {showSwitch && (
          <ZulipSwitch
            value={!!isSubscribed}
            onValueChange={(newValue: boolean) => {
              if (onSwitch) {
                onSwitch(subscription.stream_id, subscription.name, newValue);
              }
            }}
            disabled={!isSubscribed && subscription.invite_only}
          />
        )}
      </View>
    </Touchable>
  );
}
