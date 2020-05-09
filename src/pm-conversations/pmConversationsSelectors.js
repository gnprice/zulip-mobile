/* @flow strict-local */
import { createSelector } from 'reselect';

import type { Message, PmConversationData, Selector, User } from '../types';
import { getPrivateMessages } from '../message/messageSelectors';
import { getAllUsersById, getOwnUser } from '../users/userSelectors';
import { getUnreadByPms, getUnreadByHuddles } from '../unread/unreadSelectors';
import { pmUnreadsKeyFromMessage, pmKeyRecipientUsersFromMessage } from '../utils/recipient';

/**
 * Given a list of PmConversationPartial or PmConversationData, trim it down to
 * contain only the most recent message from any conversation, and return them
 * sorted by recency.
 */
const collateByRecipient = <T: { unreadsKey: string, msgId: number }>(
  items: $ReadOnlyArray<T>,
): T[] => {
  const latestByRecipients = new Map();
  items.forEach(item => {
    const prev = latestByRecipients.get(item.unreadsKey);
    if (!prev || item.msgId > prev.msgId) {
      latestByRecipients.set(item.unreadsKey, item);
    }
  });

  const sortedByMostRecent = Array.from(latestByRecipients.values()).sort(
    (a, b) => +b.msgId - +a.msgId,
  );

  return sortedByMostRecent;
};

// (Overtaken by rebase.)
// type PmConversationPartial = $Diff<PmConversationData, {| unread: mixed |}>;
// type UnreadAttacher = ($ReadOnlyArray<PmConversationPartial>) => PmConversationData[];

/**
 * Auxiliary function: fragment of the selector(s) for PmConversationData.
 * Transforms PmConversationPartial[] to PmConversationData[].
 *
 * Note that, since this will only ever be called by other selectors, the inner
 * function doesn't need to do any memoization of its own.
 */
const getAttachUnread = createSelector(
  getUnreadByPms,
  getUnreadByHuddles,
  (unreadPms: { [number]: number }, unreadHuddles: { [string]: number }) => partials =>
    partials.map(conversation => ({
      key: conversation.unreadsKey,
      keyRecipients: conversation.keyRecipients,
      msgId: conversation.msgId,
      unread:
        // This business of looking in one place and then the other is kind
        // of messy.  Fortunately it always works, because the key spaces
        // are disjoint: all `unreadHuddles` keys contain a comma, and all
        // `unreadPms` keys don't.
        /* $FlowFixMe: The keys of unreadPms are logically numbers, but because it's an object they
         end up converted to strings, so this access with string keys works.  We should probably use
         a Map for this and similar maps. */
        unreadPms[conversation.unreadsKey] || unreadHuddles[conversation.unreadsKey],
    })),
);

export const getRecentConversations: Selector<PmConversationData[]> = createSelector(
  getOwnUser,
  getPrivateMessages,
  getAttachUnread,
  getAllUsersById,
  (ownUser: User, messages: Message[], attachUnread, allUsersById): PmConversationData[] => {
    const items = messages
      .map(msg => {
        // Note this can be a different set of users from those in `keyRecipients`.
        const unreadsKey = pmUnreadsKeyFromMessage(msg, ownUser.user_id);
        const keyRecipients = pmKeyRecipientUsersFromMessage(msg, allUsersById, ownUser.user_id);
        return keyRecipients === null ? null : { unreadsKey, keyRecipients, msgId: msg.id };
      })
      .filter(Boolean);

    const sortedByMostRecent = collateByRecipient(items);

    return attachUnread(sortedByMostRecent);
  },
);

export const getUnreadConversations: Selector<PmConversationData[]> = createSelector(
  getRecentConversations,
  conversations => conversations.filter(c => c.unread > 0),
);
