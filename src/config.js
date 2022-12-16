/* @flow strict-local */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * True just if we're in "Remote JS Debugging".
 *
 * I.e., in this:
 *   https://github.com/zulip/zulip-mobile/blob/main/docs/howto/debugging.md#chrome-devtools
 */
// The `btoa` global is present in Chrome, but absent in the RN environment
// both in JavaScriptCore and in Hermes.
// TODO(#4131,#5313): When we switch to Hermes completely, this will always be false;
//   simplify it away.
const inRemoteDebugChrome = isDevelopment && !!global.btoa;

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

  enableReduxLogging: inRemoteDebugChrome,
  enableReduxSlowReducerWarnings: inRemoteDebugChrome,
  slowReducersThreshold: 5,
  enableErrorConsoleLogging: true,

  //
  // Settings that depend on the publisher of the app.

  appOwnDomains: ['zulip.com', 'zulipchat.com', 'chat.zulip.org'],
};

export default config;
