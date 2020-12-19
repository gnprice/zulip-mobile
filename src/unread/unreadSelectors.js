/* @flow strict-local */
import { createSelector } from 'reselect';

import type { Narrow, Selector } from '../types';
import { getMute, getStreams } from '../directSelectors';
import { getOwnUserId } from '../users/userSelectors';
import { getSubscriptionsById } from '../subscriptions/subscriptionSelectors';
import { isTopicMuted } from '../utils/message';
import { caseNarrow } from '../utils/narrow';
import { NULL_SUBSCRIPTION } from '../nullObjects';
import { pmUnreadsKeyFromPmKeyIds } from '../utils/recipient';
import { getUnreadStreams, getUnreadPms, getUnreadHuddles, getUnreadMentions } from './unreadModel';

/** The number of unreads in each stream, excluding muted topics, by stream ID. */
export const getUnreadByStream: Selector<{ [number]: number }> = createSelector(
  getUnreadStreams,
  getSubscriptionsById,
  getMute,
  (unreadStreams, subscriptionsById, mute) => {
    const totals = ({}: { [number]: number });
    unreadStreams.forEach(stream => {
      if (!totals[stream.stream_id]) {
        totals[stream.stream_id] = 0;
      }
      const isMuted = isTopicMuted(
        (subscriptionsById.get(stream.stream_id) || NULL_SUBSCRIPTION).name,
        stream.topic,
        mute,
      );
      totals[stream.stream_id] += isMuted ? 0 : stream.unread_message_ids.length;
    });
    return totals;
  },
);

/** Total number of unread stream messages -- ??? treatment of muting. */
// TODO: it looks like this excludes muted topics, but *includes* muted streams.
export const getUnreadStreamTotal: Selector<number> = createSelector(
  getUnreadByStream,
  unreadByStream => Object.values(unreadByStream).reduce((total, x) => +x + total, 0),
);

/**
 * The number of unreads in each 1:1 PM thread, by user ID.
 *
 * Just as in the `unread_msgs` data structure, the user used in the key is
 *  * for the self-PM thread, the self user;
 *  * for other 1:1 PM threads, the other user in the thread.
 *
 * See also `getUnreadByHuddles`, for group PM threads.
 */
export const getUnreadByPms: Selector<{ [number]: number }> = createSelector(
  getUnreadPms,
  unreadPms => {
    const totals = ({}: { [number]: number });
    unreadPms.forEach(pm => {
      totals[pm.sender_id] = totals[pm.sender_id] || 0 + pm.unread_message_ids.length;
    });
    return totals;
  },
);

/**
 * Total number of unread 1:1 PMs.
 *
 * See also `getUnreadHuddlesTotal`, for group PMs.
 */
export const getUnreadPmsTotal: Selector<number> = createSelector(
  getUnreadPms,
  unreadPms => unreadPms.reduce((total, pm) => total + pm.unread_message_ids.length, 0),
);

/**
 * The number of unreads in each group PM thread.
 *
 * The keys correspond to `user_ids_string` in the `unread_msgs` data
 * structure; see `src/api/initialDataTypes.js`.  In particular they include
 * all users in the thread, including the self user.
 *
 * See also `getUnreadByPms`, for 1:1 PM threads.
 */
export const getUnreadByHuddles: Selector<{ [string]: number }> = createSelector(
  getUnreadHuddles,
  unreadHuddles => {
    const totals = ({}: { [string]: number });
    unreadHuddles.forEach(huddle => {
      totals[huddle.user_ids_string] =
        totals[huddle.user_ids_string] || 0 + huddle.unread_message_ids.length;
    });
    return totals;
  },
);

/**
 * Total number of unread group PMs.
 *
 * See also `getUnreadPmsTotal`, for 1:1 PMs.
 */
export const getUnreadHuddlesTotal: Selector<number> = createSelector(
  getUnreadHuddles,
  unreadHuddles =>
    unreadHuddles.reduce((total, huddle) => total + huddle.unread_message_ids.length, 0),
);

/** Total number of unread @-mentions. */
export const getUnreadMentionsTotal: Selector<number> = createSelector(
  getUnreadMentions,
  unreadMentions => unreadMentions.length,
);

/** Total number of unreads, with ??? caveats. */
// TODO: This appears to double-count @-mentions.  Why not just use `count`
//   from the `unread_msgs` data structure?
// TODO: This seems to include muted streams, though not muted topics;
//   see `getUnreadStreamTotal`.  Looks like this causes #3589.
export const getUnreadTotal: Selector<number> = createSelector(
  getUnreadStreamTotal,
  getUnreadPmsTotal,
  getUnreadHuddlesTotal,
  getUnreadMentionsTotal,
  (unreadStreamTotal, unreadPmsTotal, unreadHuddlesTotal, mentionsTotal): number =>
    unreadStreamTotal + unreadPmsTotal + unreadHuddlesTotal + mentionsTotal,
);

/** Total number of a certain subset of unreads, plus ??? double-counting. */
// TODO: This appears to double-count @-mentions.
export const getUnreadByHuddlesMentionsAndPMs: Selector<number> = createSelector(
  getUnreadPmsTotal,
  getUnreadHuddlesTotal,
  getUnreadMentionsTotal,
  (unreadPms, unreadHuddles, unreadMentions) => unreadPms + unreadHuddles + unreadMentions,
);

/**
 * Total number of unreads in the given narrow... mostly.
 *
 * For the @-mention narrow, all-PMs narrow, and search narrows,
 * just returns 0.
 *
 * For the all-messages narrow, the caveats on `getUnreadTotal` apply.
 */
export const getUnreadCountForNarrow: Selector<number, Narrow> = createSelector(
  (state, narrow) => narrow,
  state => getStreams(state),
  state => getOwnUserId(state),
  state => getUnreadTotal(state),
  state => getUnreadStreams(state),
  state => getUnreadHuddles(state),
  state => getUnreadPms(state),
  state => getMute(state),
  (narrow, streams, ownUserId, unreadTotal, unreadStreams, unreadHuddles, unreadPms, mute) => {
    const sumLengths = unreads => unreads.reduce((sum, x) => sum + x.unread_message_ids.length, 0);

    return caseNarrow(narrow, {
      home: () => unreadTotal,

      stream: name => {
        const stream = streams.find(s => s.name === name);
        if (!stream) {
          return 0;
        }
        return sumLengths(
          unreadStreams.filter(
            x => x.stream_id === stream.stream_id && !isTopicMuted(name, x.topic, mute),
          ),
        );
      },

      topic: (streamName, topic) => {
        const stream = streams.find(s => s.name === streamName);
        if (!stream) {
          return 0;
        }
        return sumLengths(
          unreadStreams.filter(x => x.stream_id === stream.stream_id && x.topic === topic),
        );
      },

      pm: ids => {
        if (ids.length > 1) {
          const unreadsKey = pmUnreadsKeyFromPmKeyIds(ids, ownUserId);
          const unread = unreadHuddles.find(x => x.user_ids_string === unreadsKey);
          return unread ? unread.unread_message_ids.length : 0;
        } else {
          const senderId = ids[0];
          const unread = unreadPms.find(x => x.sender_id === senderId);
          return unread ? unread.unread_message_ids.length : 0;
        }
      },

      // Unread starred messages are impossible, so 0 is correct for the
      // starred-messages narrow.
      // TODO: fact-check that.
      starred: () => 0,

      // TODO: give a correct answer for the @-mentions narrow.
      mentioned: () => 0,

      // For search narrows, shrug, a bogus answer of 0 is fine.
      search: () => 0,

      // For the all-PMs narrow, a bogus answer of 0 is perfectly fine
      // because we never use this selector for that narrow (because we
      // don't expose it as one you can narrow to in the UI.)
      allPrivate: () => 0,
    });
  },
);
