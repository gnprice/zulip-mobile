/* @flow strict-local */
import { createSelector } from 'reselect';

import type { Selector, UnreadStreamItem } from '../types';
import { caseInsensitiveCompareFunc } from '../utils/misc';
import {
  getMute,
  getStreams,
  getUnreadStreams,
  getUnreadPms,
  getUnreadHuddles,
  getUnreadMentions,
} from '../directSelectors';
import { getOwnUserId } from '../users/userSelectors';
import { getSubscriptionsById, getStreamsById } from '../subscriptions/subscriptionSelectors';
import { isTopicMuted } from '../utils/message';
import {
  CleanNarrow,
  AllMessagesNarrow,
  StreamNarrow,
  TopicNarrow,
  PmNarrow,
} from '../utils/narrow';
import { NULL_SUBSCRIPTION } from '../nullObjects';

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

export const getUnreadStreamTotal: Selector<number> = createSelector(
  getUnreadByStream,
  unreadByStream => Object.values(unreadByStream).reduce((total, x) => +x + total, 0),
);

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

export const getUnreadPmsTotal: Selector<number> = createSelector(
  getUnreadPms,
  unreadPms => unreadPms.reduce((total, pm) => total + pm.unread_message_ids.length, 0),
);

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

export const getUnreadHuddlesTotal: Selector<number> = createSelector(
  getUnreadHuddles,
  unreadHuddles =>
    unreadHuddles.reduce((total, huddle) => total + huddle.unread_message_ids.length, 0),
);

export const getUnreadMentionsTotal: Selector<number> = createSelector(
  getUnreadMentions,
  unreadMentions => unreadMentions.length,
);

export const getUnreadTotal: Selector<number> = createSelector(
  getUnreadStreamTotal,
  getUnreadPmsTotal,
  getUnreadHuddlesTotal,
  getUnreadMentionsTotal,
  (unreadStreamTotal, unreadPmsTotal, unreadHuddlesTotal, mentionsTotal): number =>
    unreadStreamTotal + unreadPmsTotal + unreadHuddlesTotal + mentionsTotal,
);

export const getUnreadStreamsAndTopics: Selector<UnreadStreamItem[]> = createSelector(
  getSubscriptionsById,
  getUnreadStreams,
  getMute,
  (subscriptionsById, unreadStreams, mute) => {
    const totals = new Map();
    unreadStreams.forEach(stream => {
      const { name, color, in_home_view, invite_only, pin_to_top } =
        subscriptionsById.get(stream.stream_id) || NULL_SUBSCRIPTION;

      let total = totals.get(stream.stream_id);
      if (!total) {
        total = {
          key: name,
          streamName: name,
          isMuted: !in_home_view,
          isPrivate: invite_only,
          isPinned: pin_to_top,
          color,
          unread: 0,
          data: [],
        };
        totals.set(stream.stream_id, total);
      }

      const isMuted = !mute.every(x => x[0] !== name || x[1] !== stream.topic);
      if (!isMuted) {
        total.unread += stream.unread_message_ids.length;
      }

      total.data.push({
        key: stream.topic,
        topic: stream.topic,
        unread: stream.unread_message_ids.length,
        lastUnreadMsgId: stream.unread_message_ids[stream.unread_message_ids.length - 1],
        isMuted,
      });
    });

    const sortedStreams = Array.from(totals.values())
      .sort((a, b) => caseInsensitiveCompareFunc(a.streamName, b.streamName))
      .sort((a, b) => +b.isPinned - +a.isPinned);

    sortedStreams.forEach(stream => {
      stream.data.sort((a, b) => b.lastUnreadMsgId - a.lastUnreadMsgId);
    });

    return sortedStreams;
  },
);

export const getUnreadStreamsAndTopicsSansMuted: Selector<UnreadStreamItem[]> = createSelector(
  getUnreadStreamsAndTopics,
  unreadStreamsAndTopics =>
    unreadStreamsAndTopics
      .map(stream => ({
        ...stream,
        data: stream.data.filter(topic => !topic.isMuted),
      }))
      .filter(stream => !stream.isMuted && stream.data.length > 0),
);

export const getUnreadByHuddlesMentionsAndPMs: Selector<number> = createSelector(
  getUnreadPmsTotal,
  getUnreadHuddlesTotal,
  getUnreadMentionsTotal,
  (unreadPms, unreadHuddles, unreadMentions) => unreadPms + unreadHuddles + unreadMentions,
);

export const getUnreadCountForNarrow: Selector<number, CleanNarrow> = createSelector(
  (state, narrow: CleanNarrow) => narrow,
  state => getStreamsById(state),
  state => getOwnUserId(state),
  state => getUnreadTotal(state),
  state => getUnreadStreams(state),
  state => getUnreadHuddles(state),
  state => getUnreadPms(state),
  state => getMute(state),
  (narrow, streamsById, ownUserId, unreadTotal, unreadStreams, unreadHuddles, unreadPms, mute) => {
    if (narrow instanceof AllMessagesNarrow) {
      return unreadTotal;
    }

    let unreads;
    if (narrow instanceof StreamNarrow) {
      const streamName = streamsById.get(narrow.streamId)?.name;
      const isMuted = topic => streamName !== undefined && isTopicMuted(streamName, topic, mute);
      unreads = unreadStreams.filter(x => x.stream_id === narrow.streamId && !isMuted(x.topic));
    } else if (narrow instanceof TopicNarrow) {
      unreads = unreadStreams.filter(
        x => x.stream_id === narrow.streamId && x.topic === narrow.topic,
      );
    } else if (narrow instanceof PmNarrow) {
      if (narrow.userIds.length > 1) {
        const userIds = [...narrow.userIds, ownUserId].sort((a, b) => a - b).join(',');
        const unread = unreadHuddles.find(x => x.user_ids_string === userIds);
        unreads = unread ? [unread] : [];
      } else {
        const unread = unreadPms.find(x => x.sender_id === narrow.userIds[0]);
        unreads = unread ? [unread] : [];
      }
    } else {
      unreads = [];
    }

    return unreads.reduce((sum, x) => sum + x.unread_message_ids.length, 0);
  },
);
