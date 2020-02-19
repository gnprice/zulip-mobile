/* @flow strict-local */
import type { Narrow, GlobalState, Subscription } from '../types';
import { isStreamOrTopicNarrow } from '../utils/narrow';
import { getSubscriptionsByName } from '../subscriptions/subscriptionSelectors';

export const DEFAULT_TITLE_BACKGROUND_COLOR = 'transparent';

export const titleBackgroundColor = (
  narrow: Narrow | void,
  subscriptionsByName: Map<string, Subscription>,
) => {
  if (!narrow || !isStreamOrTopicNarrow(narrow)) {
    return DEFAULT_TITLE_BACKGROUND_COLOR;
  }
  const streamName = narrow[0].operand;
  return subscriptionsByName.get(streamName)?.color ?? 'gray';
};

/**
 * Background color to use for the app bar in narrow `narrow`.
 *
 * If `narrow` is a stream or topic narrow, this is based on the stream color.
 * Otherwise, it takes a default value.
 */
export const getTitleBackgroundColor = (state: GlobalState, narrow?: Narrow) => {
  const subscriptionsByName = getSubscriptionsByName(state);
  return titleBackgroundColor(narrow, subscriptionsByName);
};
