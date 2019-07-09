/* @flow strict-local */

import type {
  CrossRealmBot,
  RealmEmojiById,
  RealmFilter,
  Stream,
  Subscription,
  User,
  UserGroup,
  UserPresence,
  UserStatusMapObject,
} from './apiTypes';

export type MuteTuple = [string, string];

type NeverSubscribedStream = {|
  description: string,
  invite_only: boolean,
  is_old_stream: boolean,
  name: string,
  stream_id: number,
|};

export type StreamUnreadItem = {|
  stream_id: number,
  topic: string,
  unread_message_ids: number[],
|};

export type HuddlesUnreadItem = {|
  user_ids_string: string,
  unread_message_ids: number[],
|};

export type PmsUnreadItem = {|
  sender_id: number,
  unread_message_ids: number[],
|};

/*
 * ABOUT THESE TYPES
 *
 * These properties and their types correspond to `fetch_initial_state_data`
 * in zulip/zulip:zerver/lib/events.py .  See background docs linked in the
 * jsdoc for `InitialData`.
 *
 * Each specific object type below corresponds to a value that can be part
 * of the `event_types` passed to that function, corresponding to
 * `fetch_event_types` in the /register API:
 *   https://zulipchat.com/api/register-queue
 *
 * The `fetch_initial_state_data` function is organized by these event
 * types, so we organize this list the same way to make it easy to compare.
 */

// Data always included regardless of `event_types`.
type InitialDataBase = {|
  last_event_id: number,
  msg: string,
  queue_id: number,
|};

// For `alert_words`.
type InitialDataAlertWords = {|
  alert_words: string[],
|};

// TODO: custom_profile_fields

// TODO: hotspots

// For `message`.
type InitialDataMessage = {|
  max_message_id: number,
|};

// Etc., etc.
type InitialDataMutedTopics = {|
  muted_topics: MuteTuple[],
|};

// TODO: pointer

type InitialDataPresence = {|
  presences: {| [email: string]: UserPresence |},
|};

// TODO check this against server code, add missing stuff
// NB the `property_types` bit which provides most of these.
type InitialDataRealm = {|
  max_icon_file_size: number,
  realm_add_emoji_by_admins_only: boolean,
  realm_allow_community_topic_editing: boolean,
  realm_allow_edit_history: boolean,
  realm_allow_message_deleting: boolean,
  realm_allow_message_editing: boolean,
  realm_authentication_methods: { GitHub: true, Email: true, Google: true },
  realm_available_video_chat_providers: string[],
  realm_bot_creation_policy: number,
  realm_bot_domain: string,
  realm_create_stream_by_admins_only: boolean,
  realm_default_language: string,
  realm_default_twenty_four_hour_time: boolean,
  realm_description: string,
  realm_disallow_disposable_email_addresses: boolean,
  realm_email_auth_enabled: boolean,
  realm_email_changes_disabled: boolean,
  realm_google_hangouts_domain: string,
  realm_icon_source: string,
  realm_icon_url: string,
  realm_inline_image_preview: boolean,
  realm_inline_url_embed_preview: boolean,
  realm_invite_by_admins_only: boolean,
  realm_invite_required: boolean,
  realm_is_zephyr_mirror_realm: boolean,
  realm_mandatory_topics: boolean,
  realm_message_content_delete_limit_seconds: number,
  realm_message_content_edit_limit_seconds: number,
  realm_message_retention_days: ?number,
  realm_name: string,
  realm_name_changes_disabled: boolean,
  realm_notifications_stream_id: number,
  realm_password_auth_enabled: boolean,
  realm_presence_disabled: boolean,
  realm_restricted_to_domain: boolean,
  realm_send_welcome_emails: boolean,
  realm_show_digest_email: boolean,
  realm_signup_notifications_stream_id: number,
  realm_uri: string,
  realm_video_chat_provider: string,
  realm_waiting_period_threshold: number,
|};

// TODO realm_domains

type InitialDataRealmEmoji = {|
  realm_emoji: RealmEmojiById,
|};

type InitialDataRealmFilters = {|
  realm_filters: RealmFilter[],
|};

type InitialDataRealmUserGroups = {|
  realm_user_groups: UserGroup[],
|};

/** Despite the name, mostly about *this* user. */
type InitialDataRealmUser = {|
  // raw_users
  avatar_source: 'G',
  avatar_url_medium: string,
  avatar_url: string | null,
  can_create_streams: boolean,
  // can_subscribe_other_users
  cross_realm_bots: CrossRealmBot[], // About other users.
  is_admin: boolean,
  // is_guest
  user_id: number,
  enter_sends: boolean,
  email: string,
  // delivery_email
  full_name: string,

  realm_non_active_users: User[], // TODO ??
  realm_users: User[], // TODO ??
|};

// TODO realm_bots

// TODO realm_embedded_bots

// TODO recent_private_conversations

type InitialDataSubscription = {|
  subscriptions: Subscription[],
  unsubscribed: Subscription[],
  never_subscribed: NeverSubscribedStream[],
|};

// NB this comes only with `update_message_flags` *plus* `message`.
type InitialDataUpdateMessageFlags = {|
  unread_msgs: {
    streams: StreamUnreadItem[],
    huddles: HuddlesUnreadItem[],
    count: number,
    pms: PmsUnreadItem[],
    mentions: number[],
  },
|};

// TODO starred_messages

type InitialDataStream = {|
  streams: Stream[],
  // stream_name_max_length
  // stream_description_max_length
|};

// TODO default_stream

// TODO default_stream_groups

// TODO stop_words

// NB most of these come from `property_types`.
type InitialDataUpdateDisplaySettings = {|
  default_language: string,
  // demote_inactive_streams
  // dense_mode
  emojiset: string,
  emojiset_choices: { [string]: string },
  left_side_userlist: boolean,
  timezone: string,
  twenty_four_hour_time: boolean,
  high_contrast_mode: boolean,
  night_mode: boolean,
  translate_emoticons: boolean,
  // starred_message_counts
  // fluid_layout_width
|};

// NB most of these come from `notification_setting_types`.
type InitialDataUpdateGlobalNotifications = {|
  enable_desktop_notifications: boolean,
  enable_digest_emails: boolean,
  // enable_login_emails
  enable_offline_email_notifications: boolean,
  enable_offline_push_notifications: boolean,
  enable_online_push_notifications: boolean,
  enable_sounds: boolean,
  enable_stream_desktop_notifications: boolean,
  enable_stream_email_notifications: boolean,
  enable_stream_push_notifications: boolean,
  // enable_stream_audible_notifications: boolean, // since 2.0.0-1258-g8e269b465
  message_content_in_email_notifications: boolean,
  // notification_sound
  pm_content_in_desktop_notifications: boolean,
  realm_name_in_notifications: boolean,
  // available_notification_sounds
|};

type InitialDataUserStatus = {|
  /**
   * Older servers (through at least 1.9.1) don't send this.
   * A missing value is equivalent to empty.
   */
  user_status?: UserStatusMapObject,
|};

// TODO zulip_version

/**
 * Initial data snapshot returned in a /register response.
 *
 * For background on this system, see our docs from a client perspective:
 *   https://github.com/zulip/zulip-mobile/blob/master/docs/architecture/realtime.md
 * and a mainly server-side perspective:
 *   https://zulip.readthedocs.io/en/latest/subsystems/events-system.html
 *
 * For more on the many properties here, see comments above in this file.
 */
export type InitialData = {|
  ...InitialDataBase,
  ...InitialDataAlertWords,
  ...InitialDataMessage,
  ...InitialDataMutedTopics,
  ...InitialDataPresence,
  ...InitialDataRealm,
  ...InitialDataRealmEmoji,
  ...InitialDataRealmFilters,
  ...InitialDataRealmUser,
  ...InitialDataRealmUserGroups,
  ...InitialDataStream,
  ...InitialDataSubscription,
  ...InitialDataUpdateDisplaySettings,
  ...InitialDataUpdateGlobalNotifications,
  ...InitialDataUpdateMessageFlags,
  ...InitialDataUserStatus,
|};
