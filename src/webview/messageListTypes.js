// @flow strict-local

import type {
  AlertWordsState,
  Auth,
  Debug,
  FlagsState,
  MuteState,
  MutedUsersState,
  ImageEmojiType,
  Subscription,
  Stream,
  ThemeName,
  UserId,
  User,
  UserOrBot,
} from '../types';
import type { UnreadState } from '../unread/unreadModelTypes';

/**
 * Data about the user, the realm, and all known messages.
 *
 * This data is all independent of the specific narrow or specific messages
 * we're displaying; data about those goes elsewhere.
 *
 * We pass this object down to a variety of lower layers and helper
 * functions, where it saves us from individually wiring through all the
 * overlapping subsets of this data they respectively need.
 */
export type BackgroundData = $ReadOnly<{|
  alertWords: AlertWordsState,
  allImageEmojiById: $ReadOnly<{| [id: string]: ImageEmojiType |}>,
  auth: Auth,
  debug: Debug,
  doNotMarkMessagesAsRead: boolean,
  flags: FlagsState,
  mute: MuteState,
  allUsersById: Map<UserId, UserOrBot>,
  mutedUsers: MutedUsersState,
  ownUser: User,
  streams: Map<number, Stream>,
  subscriptions: Map<number, Subscription>,
  unread: UnreadState,
  theme: ThemeName,
  twentyFourHourTime: boolean,
  userSettingStreamNotification: boolean,
|}>;
