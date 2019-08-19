/* @flow strict-local */
import { createLogger } from 'redux-logger';

import config from '../config';

const middleware = [];

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
