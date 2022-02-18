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

type PseudoSubscription =
  | Subscription
  | $ReadOnly<{ ...Stream, color?: void, in_home_view?: void }>;

type Props = $ReadOnly<{|
  subscription: PseudoSubscription,

  isSubscribed?: boolean,

  unreadCount?: number,
  iconSize: number,
  highlight?: boolean,
  showDescription?: boolean,
  showSwitch?: boolean,
  // These stream names are here for a mix of good reasons and (#3918) bad ones.
  // To audit all uses, change `name` to write-only (`-name:`), and run Flow.
  onPress: ({ stream_id: number, name: string, ... }) => void,
  onSwitch?: ({ stream_id: number, name: string, ... }, newValue: boolean) => void,
|}>;

/**
 * A single-line list item to show a stream or stream subscription.
 *
 * Many of the props must correspond to certain properties of a Stream or
 * Subscription.
 *
 * @prop isSubscribed - whether the user is subscribed to the stream;
 *   ignored (and can be any value) unless showSwitch is true
 *
 * @prop unreadCount - number of unread messages
 * @prop iconSize
 * @prop showSwitch - whether to show a toggle switch (ZulipSwitch)
 * @prop onPress - press handler for the item
 * @prop onSwitch - if switch exists
 */
export default function StreamItem(props: Props): Node {
  const {
    subscription,
    isSubscribed = false,
    iconSize,
    highlight = false,
    showDescription = false,
    showSwitch = false,
    unreadCount,
    onPress,
    onSwitch,
  } = props;

  // prettier-ignore
  const showMuted =
    subscription.in_home_view !== undefined
      ? !subscription.in_home_view
      /* We have only a stream object, no subscription, and don't know if
         in reality the stream is muted.  So this UI won't show that distinction. */
      : false;

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

  let backgroundColor = undefined;
  let iconColor = undefined;
  let textColor = undefined;
  if (highlight) {
    backgroundColor = streamColor;
    // $FlowFixMe invariant: highlight => have sub, with color
    iconColor = foregroundColorFromBackground(streamColor);
    // $FlowFixMe invariant: highlight => have sub, with color
    textColor = (foregroundColorFromBackground(streamColor): string);
  } else {
    backgroundColor = undefined;
    iconColor = streamColor ?? foregroundColorFromBackground(themeBackgroundColor);
    textColor = themeColor;
  }

  const wrapperStyle = [styles.listItem, { backgroundColor }, showMuted && componentStyles.muted];

  return (
    <Touchable
      onPress={() => onPress({ stream_id: subscription.stream_id, name: subscription.name })}
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
          isMuted={showMuted}
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
                onSwitch({ stream_id: subscription.stream_id, name: subscription.name }, newValue);
              }
            }}
            disabled={!isSubscribed && subscription.invite_only}
          />
        )}
      </View>
    </Touchable>
  );
}
