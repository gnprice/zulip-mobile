/* @flow strict-local */

import type { Anchor } from './types';

/** See `Anchor`. */
export const FIRST_UNREAD_ANCHOR: Anchor = 'first_unread';

/** See `Anchor`. */
export const LAST_MESSAGE_ANCHOR: Anchor = 'newest';

// This special value is understood by the server, corresponding to
// LARGER_THAN_MAX_MESSAGE_ID there.  See #3654.
const LARGER_THAN_MAX_MESSAGE_ID = 10000000000000000; // sixteen zeroes

export const anchorAsNum = (anchor: Anchor): [number, boolean] => {
  switch (anchor) {
    case 'newest':
      return [LARGER_THAN_MAX_MESSAGE_ID, false];
    case 'oldest':
      return [0, false];
    case 'first_unread':
      return [0, true];
    default:
      return [anchor, false];
  }
};
