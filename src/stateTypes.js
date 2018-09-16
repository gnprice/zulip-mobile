/* @flow */

import type { Message, RealmEmojiState, RealmFilter, Stream, Subscription, Topic, User } from './api/apiTypes';
import type {
  Account,
  CaughtUp,
  Debug,
  Dimensions,
  EditMessage,
  Fetching,
  MuteTuple,
  Orientation,
  Outbox,
  Presence,
  RealmBot,
  ThemeType,
  UnreadHuddlesState,
  UnreadMentionsState,
  UnreadPmsState,
  UnreadStreamsState,
  UserGroup
} from './types';

/**
 * An index on `MessagesState`, listing messages in each narrow.
 *
 * Keys are `JSON.stringify`-encoded `Narrow` objects.
 * Values are sorted lists of message IDs.
 *
 * See also `MessagesState`, which stores the message data indexed by ID.
 */
export type NarrowsState = {
  [narrow: string]: number[],
};

/**
 * A map with all messages we've stored locally, indexed by ID.
 *
 * See also `NarrowsState`, which is an index on this data that identifies
 * messages belonging to a given narrow.
 */
export type MessagesState = {
  [id: number]: Message,
};

export type StreamsState = Stream[];

export type SubscriptionsState = Subscription[];

export type AccountsState = Account[];

export type SessionState = {
  eventQueueId: number,
  editMessage: ?EditMessage,
  isOnline: boolean,
  isActive: boolean,
  isHydrated: boolean,
  needsInitialFetch: boolean,
  orientation: Orientation,
  outboxSending: boolean,
  safeAreaInsets: Dimensions,
  debug: Debug,
};

/**
 * Info about how completely we know the messages in each narrow of
 * MessagesState.
 */
export type CaughtUpState = {
  [narrow: string]: CaughtUp,
};

export type FetchingState = {
  [narrow: string]: Fetching,
};

export type FlagsState = {
  [flagName: string]: {
    [messageId: number]: boolean,
  },
};

export type MigrationsState = {
  version?: string,
};

export type LoadingState = {
  presence: boolean,
  subscriptions: boolean,
  streams: boolean,
  unread: boolean,
  users: boolean,
};

export type MuteState = MuteTuple[];

export type NavigationState = {
  index: number,
  isTransitioning: boolean,
  key: string,
  routes: Array<{
    key: string,
    title: string,
    routeName: string,
    /** The fields in `params` vary by route; see `navActions.js`. */
    params: {
      narrow?: Narrow,
    },
  }>,
};
/**
 * State with general info about a Zulip organization; our state subtree `realm`.
 *
 * @prop twentyFourHourTime
 * @prop canCreateStreams
 * @prop crossRealmBots - The server's cross-realm bots; e.g., Welcome Bot.
 *   Cross-realm bots should be treated like normal bots.
 * @prop nonActiveUsers - All users in the organization with `is_active`
 *   false; for normal users, this means they or an admin deactivated their
 *   account.  See `User` and the linked documentation.
 * @prop pushToken
 * @prop filters
 * @prop emoji
 * @prop isAdmin
 */
export type RealmState = {
  twentyFourHourTime: boolean,
  canCreateStreams: boolean,
  crossRealmBots: RealmBot[],
  nonActiveUsers: User[],
  pushToken: {
    token: string,
    msg: string,
    result: string,
  },
  filters: RealmFilter[],
  emoji: RealmEmojiState,
  isAdmin: boolean,
};

export type TopicsState = {
  [number]: Topic[],
};

export type SettingsState = {
  locale: string,
  theme: ThemeType,
  offlineNotification: boolean,
  onlineNotification: boolean,
  experimentalFeaturesEnabled: boolean,
  streamNotification: boolean,
};

export type TypingState = {
  [normalizedRecipients: string]: {
    time: number,
    userIds: number[],
  },
};

export type AlertWordsState = string[];

export type DraftsState = {
  [narrow: string]: string,
};

/**
 * A collection of (almost) all users in the Zulip org; our `users` state subtree.
 *
 * This contains all users except deactivated users and cross-realm bots.
 * For those, see RealmState.
 */
export type UsersState = User[];

export type UserGroupsState = UserGroup[];

/**
 * The `presence` subtree of our Redux state.
 *
 * @prop (email) - Indexes over all users for which the app has received a
 *   presence status.
 */
export type PresenceState = {
  [email: string]: Presence,
};

export type OutboxState = Outbox[];

export type UnreadState = {
  streams: UnreadStreamsState,
  huddles: UnreadHuddlesState,
  pms: UnreadPmsState,
  mentions: UnreadMentionsState,
};

/**
 * Our complete Redux state tree.
 *
 * Each property is a subtree maintained by its own reducer function.
 */
export type GlobalState = {
  accounts: AccountsState,
  alertWords: AlertWordsState,
  caughtUp: CaughtUpState,
  drafts: DraftsState,
  fetching: FetchingState,
  flags: FlagsState,
  migrations: MigrationsState,
  loading: LoadingState,
  messages: MessagesState,
  mute: MuteState,
  narrows: NarrowsState,
  nav: NavigationState,
  outbox: OutboxState,
  presence: PresenceState,
  realm: RealmState,
  session: SessionState,
  settings: SettingsState,
  streams: StreamsState,
  subscriptions: SubscriptionsState,
  topics: TopicsState,
  typing: TypingState,
  unread: UnreadState,
  userGroups: UserGroupsState,
  users: UsersState,
};
