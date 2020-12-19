/* @flow strict-local */

import React, { PureComponent } from 'react';
import { SectionList } from 'react-native';
import { createSelector } from 'reselect';

import type { Dispatch, PmConversationData, Selector, UnreadStreamItem } from '../types';
import { caseInsensitiveCompareFunc } from '../utils/misc';
import { connect } from '../react-redux';
import { SearchEmptyState } from '../common';
import PmConversationList from '../pm-conversations/PmConversationList';
import StreamItem from '../streams/StreamItem';
import TopicItem from '../streams/TopicItem';
import { streamNarrow, topicNarrow } from '../utils/narrow';
import { getUnreadPmConversations } from '../selectors';
import { doNarrow } from '../actions';
import { getSubscriptionsById } from '../subscriptions/subscriptionSelectors';
import { getMute } from '../directSelectors';
import { getUnreadStreams } from './unreadModel';
import { NULL_SUBSCRIPTION } from '../nullObjects';
import * as logging from '../utils/logging';

type Props = $ReadOnly<{|
  pmConversations: PmConversationData[],
  dispatch: Dispatch,
  unreadStreamsAndTopics: UnreadStreamItem[],
|}>;

class UnreadCards extends PureComponent<Props> {
  handleStreamPress = (stream: string) => {
    setTimeout(() => this.props.dispatch(doNarrow(streamNarrow(stream))));
  };

  handleTopicPress = (stream: string, topic: string) => {
    setTimeout(() => this.props.dispatch(doNarrow(topicNarrow(stream, topic))));
  };

  render() {
    const { pmConversations, dispatch, unreadStreamsAndTopics } = this.props;
    type Card =
      | UnreadStreamItem
      | { key: 'private', data: Array<React$ElementConfig<typeof PmConversationList>> };
    const unreadCards: Array<Card> = [
      {
        key: 'private',
        data: [{ pmConversations, dispatch }],
      },
      ...unreadStreamsAndTopics,
    ];

    if (unreadStreamsAndTopics.length === 0 && pmConversations.length === 0) {
      return <SearchEmptyState text="No unread messages" />;
    }

    return (
      /* $FlowFixMe[prop-missing]: SectionList libdef seems confused;
         should take $ReadOnly objects. */
      <SectionList
        stickySectionHeadersEnabled
        initialNumToRender={20}
        sections={unreadCards}
        keyExtractor={item => item.key}
        renderSectionHeader={({ section }) =>
          section.key === 'private' ? null : (
            <StreamItem
              name={section.streamName}
              iconSize={16}
              isMuted={false}
              isPrivate={section.isPrivate}
              backgroundColor={section.color}
              unreadCount={section.unread}
              onPress={this.handleStreamPress}
            />
          )
        }
        renderItem={({ item, section }) =>
          section.key === 'private' ? (
            <PmConversationList {...item} />
          ) : (
            <TopicItem
              name={item.topic}
              stream={section.streamName || ''}
              isMuted={item.isMuted}
              isSelected={false}
              unreadCount={item.unread}
              onPress={this.handleTopicPress}
            />
          )
        }
      />
    );
  }
}

/** Helper for getUnreadStreamsAndTopicsSansMuted; see there. */
export const getUnreadStreamsAndTopics: Selector<UnreadStreamItem[]> = createSelector(
  getSubscriptionsById,
  getUnreadStreams,
  getMute,
  (subscriptionsById, unreadStreams, mute) => {
    const dataByStream = new Map();
    unreadStreams.forEach(stream => {
      const { name, color, in_home_view, invite_only, pin_to_top } =
        subscriptionsById.get(stream.stream_id) || NULL_SUBSCRIPTION;

      if (!in_home_view) {
        return; // i.e., continue
      }

      let streamData = dataByStream.get(stream.stream_id);
      if (!streamData) {
        streamData = {
          key: `stream:${name}`,
          streamName: name,
          isPrivate: invite_only,
          isPinned: pin_to_top,
          color,
          unread: 0,
          topics: [],
        };
        dataByStream.set(stream.stream_id, streamData);
      }

      const isMuted = !mute.every(x => x[0] !== name || x[1] !== stream.topic);
      if (isMuted) {
        return; // i.e., continue
      }

      streamData.unread += stream.unread_message_ids.length;
      streamData.topics.push({
        key: stream.topic,
        topic: stream.topic,
        unread: stream.unread_message_ids.length,
        lastUnreadMsgId: stream.unread_message_ids[stream.unread_message_ids.length - 1],
      });
    });

    const sortedStreamData = Array.from(dataByStream.values())
      .sort((a, b) => caseInsensitiveCompareFunc(a.streamName, b.streamName))
      .sort((a, b) => +b.isPinned - +a.isPinned);

    sortedStreamData.forEach(streamData => {
      streamData.topics.sort((a, b) => b.lastUnreadMsgId - a.lastUnreadMsgId);
    });

    return sortedStreamData;
  },
);

/**
 * Summary of unread unmuted stream messages, to feed to the unreads screen.
 *
 * The exact collection of data included here is just an assortment of what
 * the unreads screen happens to need.
 *
 * Each stream with unmuted unreads appears as an element of the array, and
 * contains in `.data` an array with an element for each unmuted topic that
 * has unreads.
 */
export const getUnreadStreamsAndTopicsSansMuted: Selector<UnreadStreamItem[]> = createSelector(
  getUnreadStreamsAndTopics,
  unreadStreamsAndTopics => unreadStreamsAndTopics,
);

export default connect(state => ({
  pmConversations: getUnreadPmConversations(state),
  unreadStreamsAndTopics: getUnreadStreamsAndTopicsSansMuted(state),
}))(UnreadCards);
