/* @flow strict-local */
import { createLogger } from 'redux-logger';
import createActionBuffer from 'redux-action-buffer';

import config from '../config';
import { REHYDRATE } from '../actionConstants';

const middleware = [createActionBuffer(REHYDRATE)];

if (config.enableReduxLogging) {
  middleware.push(
    createLogger({
      duration: true,
      // See docs/howto/debugging.md.
      // diff: true,
      // predicate: (getState, action) => action.type === 'MESSAGE_FETCH_COMPLETE',
    }),
  );
}

export default middleware;
