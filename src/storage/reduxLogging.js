// @flow strict-local

import type { Action } from '../actionTypes';
import type { GlobalState } from '../reduxTypes';
import { inRemoteDebugChrome } from '../config';
import timing from '../utils/timing';

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
