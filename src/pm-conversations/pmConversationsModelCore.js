/* @flow strict-local */
import Immutable from 'immutable';

import { makeUserId } from '../api/idTypes';
import type { PmMessage, UserId } from '../api/apiTypes';
import type { PmOutbox } from '../localModelTypes';
import { recipientsOfPrivateMessage } from '../utils/recipient';

//
//
// Keys.
//

/** The key identifying a PM conversation in this data structure. */
// User IDs, excluding self, sorted numerically, joined with commas.
export opaque type PmConversationKey = string;

/**
 * PRIVATE.  Exported only for tests.
 *
 * Sorts `ids` in-place.
 */
// Input must have the exact right (multi-)set of users.  Needn't be sorted.
export function keyOfExactUsers(ids: UserId[]): PmConversationKey {
  return ids.sort((a, b) => a - b).join(',');
}

// Input may contain self or not, and needn't be sorted.
function keyOfUsers(ids: $ReadOnlyArray<UserId>, ownUserId: UserId): PmConversationKey {
  return keyOfExactUsers(ids.filter(id => id !== ownUserId));
}

export function keyOfPrivateMessage(
  msg: PmMessage | PmOutbox,
  ownUserId: UserId,
): PmConversationKey {
  return keyOfUsers(
    recipientsOfPrivateMessage(msg).map(r => r.id),
    ownUserId,
  );
}

/** The users in the conversation, other than self. */
export function usersOfKey(key: PmConversationKey): UserId[] {
  return key ? key.split(',').map(s => makeUserId(Number.parseInt(s, 10))) : [];
}

//
//
// State.
//

/**
 * The list of recent PM conversations, plus data to efficiently maintain it.
 *
 * This gets initialized from the `recent_private_conversations` data
 * structure in the `/register` response (aka our initial fetch), and then
 * kept up to date as we learn about new or newly-fetched messages.
 */
// (Compare the webapp's implementation, in static/js/pm_conversations.js.)
export type PmConversationsState = $ReadOnly<{|
  // The latest message ID in each conversation.
  map: Immutable.Map<PmConversationKey, number>,

  // The keys of the map, sorted by latest message descending.
  sorted: Immutable.List<PmConversationKey>,
|}>;
