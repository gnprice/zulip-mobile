/* @flow strict-local */
import type { Narrow, GlobalState } from '../types';
import { tryStreamNameOfNarrow } from '../utils/narrow';
import { getSubscriptionColorForName } from '../subscriptions/subscriptionSelectors';

export const DEFAULT_TITLE_BACKGROUND_COLOR = 'transparent';

/**
 * Background color to use for the app bar in narrow `narrow`.
 *
 * If `narrow` is a stream or topic narrow, this is based on the stream color.
 * Otherwise, it takes a default value.
 */
export const getTitleBackgroundColor = (state: GlobalState, narrow?: Narrow) => {
  const streamName = tryStreamNameOfNarrow(narrow);
  if (streamName === null) {
    return DEFAULT_TITLE_BACKGROUND_COLOR;
  }
  return getSubscriptionColorForName(state, streamName);
};
