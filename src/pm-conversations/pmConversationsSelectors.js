/* @flow strict-local */
import { createSelector } from 'reselect';

import type {
  GlobalState,
  Message,
  PmConversationData,
  RecentPrivateConversation,
  Selector,
  User,
  UserOrBot,
} from '../types';
import { getServerVersion } from '../account/accountsSelectors';
import { getPrivateMessages } from '../message/messageSelectors';
import { getAllUsersById, getOwnUser } from '../users/userSelectors';
import { getRecentPrivateConversations, getUnreadPms } from '../directSelectors';
import { getUnreadByPms, getUnreadByHuddles } from '../unread/unreadSelectors';
import {
  pmUnreadsKeyFromMessage,
  pmKeyRecipientUsersFromMessage,
  pmKeyRecipientsFromIds,
  pmUnreadsKeyFromPmKeyIds,
} from '../utils/recipient';
import { ZulipVersion } from '../utils/zulipVersion';

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
const attachUnread = (
  unreadPms: { [number]: number },
  unreadHuddles: { [string]: number },
  partials,
) =>
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
  }));

/**
 * Legacy implementation of {@link getRecentConversations}. Computes an
 * approximation to the set of recent conversations, based on the messages we
 * already know about.
 */
const getRecentConversationsLegacyImpl: Selector<PmConversationData[]> = createSelector(
  getOwnUser,
  getPrivateMessages,
  getUnreadByPms,
  getUnreadByHuddles,
  getAllUsersById,
  (
    ownUser: User,
    messages: Message[],
    unreadPms,
    unreadHuddles,
    allUsersById,
  ): PmConversationData[] => {
    const items = messages
      .map(msg => {
        // Note this can be a different set of users from those in `keyRecipients`.
        const unreadsKey = pmUnreadsKeyFromMessage(msg, ownUser.user_id);
        const keyRecipients = pmKeyRecipientUsersFromMessage(msg, allUsersById, ownUser.user_id);
        return keyRecipients === null ? null : { unreadsKey, keyRecipients, msgId: msg.id };
      })
      .filter(Boolean);

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

    return attachUnread(unreadPms, unreadHuddles, sortedByMostRecent);
  },
);

/**
 * Modern implementation of {@link getRecentConversations}. Returns exactly the
 * most recent conversations. Requires server-side support.
 */
const getRecentConversationsImpl: Selector<PmConversationData[]> = createSelector(
  getOwnUser,
  getAllUsersById,
  getRecentPrivateConversations,
  getUnreadByPms,
  getUnreadByHuddles,
  (
    ownUser: User,
    allUsersById: Map<number, UserOrBot>,
    recentPCs: RecentPrivateConversation[],
    unreadPms,
    unreadHuddles,
  ) => {
    const latestByRecipients = recentPCs.map(conversation => {
      // TODO this is wrong for a self-1:1 -- doesn't add back self
      //   (And that means pmKeyRecipientsFromIds has a bug.)
      const keyRecipients = pmKeyRecipientsFromIds(
        conversation.user_ids,
        allUsersById,
        ownUser.user_id,
      );
      if (!keyRecipients) {
        throw new Error('getRecentConversations: unknown user id');
      }

      return {
        unreadsKey: pmUnreadsKeyFromPmKeyIds(keyRecipients.map(r => r.user_id), ownUser.user_id),
        keyRecipients,
        msgId: conversation.max_message_id,
      };
    });

    return attachUnread(unreadPms, unreadHuddles, latestByRecipients);
  },
);

/**
 * The server version in which 'recent_private_conversations' was first made
 * available.
 */
const DIVIDING_LINE = new ZulipVersion('2.1-dev-384-g4c3c669b41');

// Private. Selector to choose between other selectors. (This avoids needlessly
// recomputing the old version when we're on a new server, or vice versa.)
const getServerIsOld: Selector<boolean> = createSelector(
  getServerVersion,
  version => !(version && version.isAtLeast(DIVIDING_LINE)),
);

/**
 * Get a list of the most recent private conversations, including the most
 * recent message from each.
 *
 * Switches between implementations as appropriate for the current server
 * version.
 */
export const getRecentConversations = (state: GlobalState): PmConversationData[] => {
  if (!getServerIsOld(state)) {
    // If we're talking to a new enough version of the Zulip server, we don't
    // need the legacy impl; the modern one will always return a superset of
    // its content.
    return getRecentConversationsImpl(state);
  }

  // If we're _not_ talking to a newer version of the Zulip server, then
  // there's no point in using the modern version; it will only return
  // messages received in the current session, which should all be in the
  // legacy impl's data as well.
  return getRecentConversationsLegacyImpl(state);
};

export const getUnreadConversations: Selector<PmConversationData[]> = createSelector(
  getRecentConversations,
  conversations => conversations.filter(c => c.unread > 0),
);
