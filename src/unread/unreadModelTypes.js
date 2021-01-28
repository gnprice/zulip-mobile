/* @flow strict-local */
import Immutable from 'immutable';

import type { HuddlesUnreadItem, PmsUnreadItem } from '../api/apiTypes';

// These four are fragments of UnreadState; see below.
export type UnreadStreamsState = Immutable.Map<number, Immutable.Map<string, number[]>>;
export type UnreadHuddlesState = HuddlesUnreadItem[];
export type UnreadPmsState = PmsUnreadItem[];
export type UnreadMentionsState = number[];

/**
 * A summary of (almost) all unread messages, even those we don't have.
 *
 * The initial version the server gives us for this data is `unread_msgs` in
 * the `/register` initial state, and we largely follow the structure of
 * that.  See there (in `src/api/initialDataTypes.js`) for details.
 */
export type UnreadState = {|
  streams: UnreadStreamsState,
  huddles: UnreadHuddlesState,
  pms: UnreadPmsState,
  mentions: UnreadMentionsState,
|};
