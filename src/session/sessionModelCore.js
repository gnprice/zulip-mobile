// @flow strict-local
import type { Debug, Orientation } from '../localModelTypes';

/**
 * Miscellaneous non-persistent state specific to a particular account.
 *
 * See {@link SessionState} for discussion of what "non-persistent" means.
 */
export type PerAccountSessionState = $ReadOnly<{
  eventQueueId: string | null,

  /**
   * Whether the /register request is in progress.
   *
   * This happens on startup, or on re-init following a dead event
   * queue after 10 minutes of inactivity.
   */
  loading: boolean,

  needsInitialFetch: boolean,

  outboxSending: boolean,

  /**
   * Whether `ServerCompatNotice` (which we'll add soon) has been
   *   dismissed this session.
   *
   * We put this in the per-session state deliberately, so that users
   * see the notice on every startup until the server is upgraded.
   * That's a better experience than not being able to load the realm
   * on mobile at all, which is what will happen soon if the user
   * doesn't act on the notice.
   */
  hasDismissedServerCompatNotice: boolean,

  ...
}>;

/**
 * Miscellaneous non-persistent state independent of account.
 *
 * This contains data about the device and the app as a whole, independent
 * of any particular Zulip server or account.
 *
 * See {@link SessionState} for discussion of what "non-persistent" means.
 */
export type GlobalSessionState = $ReadOnly<{
  // `null` if we don't know. See the place where we set this, for what that
  // means.
  isOnline: boolean | null,

  isHydrated: boolean,

  orientation: Orientation,

  /**
   * Our actual device token, as most recently learned from the system.
   *
   * With FCM/GCM this is the "registration token"; with APNs the "device
   * token".
   *
   * This is `null` before we've gotten a token. On Android, we may also receive
   * an explicit `null` token if the device can't or won't give us a real one.
   *
   * See upstream docs:
   *   https://firebase.google.com/docs/cloud-messaging/android/client#sample-register
   *   https://developers.google.com/cloud-messaging/android/client
   *   https://developer.apple.com/documentation/usernotifications/registering_your_app_with_apns
   *
   * See also discussion at https://stackoverflow.com/q/37517860.
   */
  pushToken: string | null,

  debug: Debug,

  ...
}>;

/**
 * Miscellaneous non-persistent state about this run of the app.
 *
 * These state items are stored in `session.state`, and 'session' is
 * in `discardKeys` in src/boot/store.js. That means these values
 * won't be persisted between sessions; on startup, they'll all be
 * initialized to their default values.
 */
export type SessionState = $ReadOnly<{|
  ...$Exact<GlobalSessionState>,
  ...$Exact<PerAccountSessionState>,
|}>;

// As part of letting GlobalState freely convert to PerAccountState,
// we'll want the same for SessionState.  (This is also why
// PerAccountSessionState is inexact.)
(s: SessionState): PerAccountSessionState => s; // eslint-disable-line no-unused-expressions
