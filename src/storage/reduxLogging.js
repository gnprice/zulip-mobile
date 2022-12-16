// @flow strict-local
// $FlowFixMe[untyped-import]
import { createLogger } from 'redux-logger';
import Immutable from 'immutable';

import type { Action } from '../actionTypes';
import type { GlobalState } from '../reduxTypes';
import { inRemoteDebugChrome } from '../config';
import timing from '../utils/timing';
import {
  PRESENCE_RESPONSE,
  REFRESH_SERVER_EMOJI_DATA,
  REGISTER_COMPLETE,
  REHYDRATE,
} from '../actionConstants';

if (inRemoteDebugChrome) {
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

/**
 * Whether to log each action to the console -- often handy in development.
 *
 * Edit this to true to enable `redux-logger`.  By default, true just when
 * using "Remote JS Debugging" -- so in particular never true on Android
 * (where we're using Hermes.)
 *
 * When enabling, consider also editing `createReduxLogger` below to
 * customize what you see.
 */
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
  let opts = {
    // Example options to add for more focused information, depending on
    // what you're investigating; see docs/howto/debugging.md (link above).
    //   diff: true,
    //   collapsed: true,
    //   collapsed: (getState, action) => action.type !== 'MESSAGE_FETCH_COMPLETE',
    //   predicate: (getState, action) => action.type === 'MESSAGE_FETCH_COMPLETE',
    //
    // Also see below.

    duration: true,
  };

  // (Yes, this conditional is dead code.  It exists for when a developer
  // edits the value of `enableReduxLogging` above.)
  if (!inRemoteDebugChrome) {
    // If we're not in "Remote JS Debugging", then everything this logs will
    // go to the Metro console as well as Chrome DevTools.  That means if we
    // spew something giant, like the entire state, the whole thing gets
    // printed -- which is unreadable, and also makes the app very slow.
    // So cut down the verbosity a lot.
    //
    // When debugging, customize this as needed.  For example, to see
    // whatever part of the state is relevant for you:
    //   stateTransformer: state => { caughtUp: state.caughtUp },
    // See also docs linked above.

    opts = {
      ...opts,

      // TODO: It'd be nice to find a way to suppress the before/after lines
      //   entirely when we're not showing anything in them.
      stateTransformer: state => 'omitted',

      actionTransformer: action => {
        switch (action.type) {
          case PRESENCE_RESPONSE:
          case REFRESH_SERVER_EMOJI_DATA:
          case REGISTER_COMPLETE:
          case REHYDRATE:
            // Abbreviate actions that tend to be very large.
            return { type: action.type, '…': '…' };

          default:
            // Show the rest.
            return action;
        }
      },
    };
  }

  return createLogger(opts);
}
