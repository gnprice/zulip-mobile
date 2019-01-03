/* @flow strict-local */
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import createActionBuffer from 'redux-action-buffer';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';

import config from '../config';
import { REHYDRATE, GOT_PUSH_TOKEN } from '../actionConstants';
import { getNav } from '../selectors';

const reactNavigationMiddleware = createReactNavigationReduxMiddleware('root', getNav);

const middleware = [
  reactNavigationMiddleware,
  createActionBuffer({ breaker: REHYDRATE, passthrough: [GOT_PUSH_TOKEN] }),
  thunk,
];

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
