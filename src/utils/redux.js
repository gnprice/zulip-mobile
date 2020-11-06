/* @flow strict-local */
import config from '../config';
import timing from './timing';

export function logSlowReducers<O: {}>(reducers: O): O {
  for (const name: string of Object.keys(reducers)) {
    const originalReducer = reducers[name];
    reducers[name] = (state, action) => {
      const startMs = Date.now();
      const result = originalReducer(state, action);
      const endMs = Date.now();
      if (endMs - startMs >= config.slowReducersThreshold) {
        timing.add({
          text: `${action.type} @ ${name}`,
          startMs,
          endMs,
        });
      }
      return result;
    };
  }

  return reducers;
}
