/* @flow strict-local */

const isDevelopment = process.env.NODE_ENV === 'development';

// True just when we're using remote JS debugging.
// When that's the case, our JS code is actually running in the Chrome
// that's providing the debugging environment.  As a hack to detect that,
// we look for the `btoa` global, which isn't present in the JS engine
// provided by RN for running the actual app.  (At least it isn't in JSC.)
const isRemoteDebugging: boolean = isDevelopment && !!global.btoa;

type Config = {|
  requestLongTimeoutMs: number,
  messagesPerRequest: number,
  messageListThreshold: number,
  enableReduxLogging: boolean,
  enableReduxSlowReducerWarnings: boolean,
  slowReducersThreshold: number,
  enableErrorConsoleLogging: boolean,
  serverDataOnStartup: string[],
  appOwnDomains: string[],
|};

const config: Config = {
  // A completely unreasonable amount of time for a request, or
  // several retries of a request, to take. If this elapses, we're
  // better off giving up.
  requestLongTimeoutMs: 60 * 1000,

  messagesPerRequest: 100,
  messageListThreshold: 4000,
  enableReduxLogging: isRemoteDebugging,
  enableReduxSlowReducerWarnings: isRemoteDebugging,
  slowReducersThreshold: 5,
  enableErrorConsoleLogging: true,
  serverDataOnStartup: [
    'alert_words',
    'message',
    'muted_topics',
    'muted_users',
    'presence',
    'realm',
    'realm_emoji',
    'realm_filters',
    'realm_linkifiers',
    'realm_user',
    'realm_user_groups',
    'recent_private_conversations',
    'stream',
    'subscription',
    'update_display_settings',
    'update_global_notifications',
    'update_message_flags',
    'user_status',
    'zulip_version',
  ],
  appOwnDomains: ['zulip.com', 'zulipchat.com', 'chat.zulip.org'],
};

export default config;
