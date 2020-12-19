/* @flow strict-local */

const isDevelopment = process.env.NODE_ENV === 'development';

// True just when we're using remote JS debugging.
// When that's the case, our JS code is actually running in the Chrome
// that's providing the debugging environment.  As a hack to detect that,
// we look for the `btoa` global, which isn't present in the JS engine
// provided by RN for running the actual app.  (At least it isn't in JSC.)
const isRemoteDebugging = isDevelopment && !!global.btoa;

type Config = {|
  messagesPerRequest: number,
  messageListThreshold: number,
  enableReduxLogging: boolean,
  enableReduxSlowReducerWarnings: boolean,
  enableWebViewErrorDisplay: boolean,
  slowReducersThreshold: number,
  sentryKey: string | null,
  enableErrorConsoleLogging: boolean,
  serverDataOnStartup: string[],
  appOwnDomains: string[],
|};

const config: Config = {
  messagesPerRequest: 100,
  messageListThreshold: 4000,
  enableReduxLogging: isRemoteDebugging,
  enableReduxSlowReducerWarnings: isRemoteDebugging,
  enableWebViewErrorDisplay: isDevelopment,
  slowReducersThreshold: 5,
  sentryKey: null, // add DSN here
  enableErrorConsoleLogging: true,
  serverDataOnStartup: [
    'alert_words',
    'message',
    'muted_topics',
    'presence',
    'realm',
    'realm_emoji',
    'realm_filters',
    'realm_user',
    'realm_user_groups',
    'recent_private_conversations',
    'stream',
    'subscription',
    'update_display_settings',
    'update_global_notifications',
    'update_message_flags',
    'user_status',
  ],
  appOwnDomains: ['zulip.com', 'zulipchat.com', 'chat.zulip.org'],
};

export default config;
