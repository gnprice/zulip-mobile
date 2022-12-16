// @flow strict-local
// $FlowFixMe[untyped-import]
import { createLogger } from 'redux-logger';
import Immutable from 'immutable';

import type { Action } from '../actionTypes';
import type { GlobalState } from '../reduxTypes';
import { inRemoteDebugChrome } from '../config';
import timing from '../utils/timing';

if (process.env.NODE_ENV === 'development') {
  // Chrome dev tools for Immutable.
  //
  // To enable, press F1 from the Chrome dev tools to open the
  // settings. In the "Console" section, check "Enable custom
  // formatters".
  //
  // $FlowFixMe[untyped-import]
  const installDevTools = require('immutable-devtools'); // eslint-disable-line import/no-extraneous-dependencies, global-require
  installDevTools(Immutable);
}

export const enableReduxLogging = inRemoteDebugChrome;
export const enableReduxSlowReducerWarnings = inRemoteDebugChrome;
export const slowReducersThreshold = 5;

export function maybeLogSlowReducer(
  action: Action,
  key: $Keys<GlobalState>,
  startMs: number,
  endMs: number,
) {
  if (endMs - startMs >= slowReducersThreshold) {
    timing.add({ text: `${action.type} @ ${key}`, startMs, endMs });
  }
}

export function createReduxLogger(): mixed {
  // See upstream docs:
  //   https://github.com/LogRocket/redux-logger
  // and ours:
  //   https://github.com/zulip/zulip-mobile/blob/main/docs/howto/debugging.md#redux-logger
  return createLogger({
    duration: true,
    // Example options to add for more focused information, depending on
    // what you're investigating; see docs/howto/debugging.md (link above).
    //   diff: true,
    //   collapsed: true,
    //   collapsed: (getState, action) => action.type !== 'MESSAGE_FETCH_COMPLETE',
    //   predicate: (getState, action) => action.type === 'MESSAGE_FETCH_COMPLETE',
  });
}
