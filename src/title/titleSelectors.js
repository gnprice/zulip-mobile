/* @flow strict-local */
import { createSelector } from 'reselect';

import type { Narrow, Selector } from '../types';
import { getSubscriptions } from '../directSelectors';
import { streamNameFromNarrow } from '../utils/narrow';
import { NULL_SUBSCRIPTION } from '../nullObjects';

export const DEFAULT_TITLE_BACKGROUND_COLOR = 'transparent';

/**
 * Background color to use for the app bar in narrow `narrow`.
 *
 * If `narrow` is a stream or topic narrow, this is based on the stream color.
 * Otherwise, it takes a default value.
 */
export const getTitleBackgroundColor = (narrow?: Narrow): Selector<string> =>
  createSelector(getSubscriptions, subscriptions => {
    const streamName = narrow && streamNameFromNarrow(narrow);
    if (!narrow || streamName === null) {
      return DEFAULT_TITLE_BACKGROUND_COLOR;
    }
    return (subscriptions.find(sub => streamName === sub.name) || NULL_SUBSCRIPTION).color;
  });
