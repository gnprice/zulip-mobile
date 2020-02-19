/* @flow strict-local */
import type { Narrow, GlobalState } from '../types';
import { getSubscriptionColorForNarrow } from '../subscriptions/subscriptionSelectors';

export const DEFAULT_TITLE_BACKGROUND_COLOR = 'transparent';

/**
 * Background color to use for the app bar in narrow `narrow`.
 *
 * If `narrow` is a stream or topic narrow, this is based on the stream color.
 * Otherwise, it takes a default value.
 */
export const getTitleBackgroundColor = (state: GlobalState, narrow: Narrow) =>
  getSubscriptionColorForNarrow(state, narrow) ?? DEFAULT_TITLE_BACKGROUND_COLOR;
