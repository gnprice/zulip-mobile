/* @flow strict-local */
const isDevelopment = process.env.NODE_ENV === 'development';

type Config = {|
  requestLongTimeoutMs: number,
  messagesPerRequest: number,
  messageListThreshold: number,
  enableReduxLogging: boolean,
  enableReduxSlowReducerWarnings: boolean,
  slowReducersThreshold: number,
  enableErrorConsoleLogging: boolean,
  appOwnDomains: $ReadOnlyArray<string>,
|};

const config: Config = {
  //
  // Timing and tuning settings.

  // A completely unreasonable amount of time for a request, or
  // several retries of a request, to take. If this elapses, we're
  // better off giving up.
  requestLongTimeoutMs: 60 * 1000,

  messagesPerRequest: 100,
  messageListThreshold: 4000,

  //
  // Debugging settings.

  enableReduxLogging: isDevelopment && !!global.btoa,
  enableReduxSlowReducerWarnings: isDevelopment && !!global.btoa,
  slowReducersThreshold: 5,
  enableErrorConsoleLogging: true,

  //
  // Settings that depend on the publisher of the app.

  appOwnDomains: ['zulip.com', 'zulipchat.com', 'chat.zulip.org'],
};

export default config;
