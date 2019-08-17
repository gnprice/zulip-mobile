/* @flow strict-local */
import type {
  GlobalState,
  DraftsState,
  FetchingState,
  FlagsState,
  LoadingState,
  MessagesState,
  MuteState,
  NarrowsState,
  TopicsState,
  PresenceState,
  CrossRealmBot,
  RealmEmojiById,
  RealmState,
  SettingsState,
  StreamUnreadItem,
  TypingState,
  UnreadHuddlesState,
  UnreadMentionsState,
  UnreadPmsState,
  Account,
  Debug,
  Subscription,
  Stream,
  Outbox,
  User,
  UserGroup,
  UserStatusState,
} from './types';
import type { SessionState } from './session/sessionReducer';

export const getAccounts = (state: GlobalState): Account[] => state.accounts;

