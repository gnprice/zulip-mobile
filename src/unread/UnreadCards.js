/* @flow strict-local */

import React, { PureComponent } from 'react';
import { SectionList } from 'react-native';
import type { SectionBase } from 'react-native/Libraries/Lists/VirtualizedSectionList';

import type {
  Dispatch,
  PmConversationData,
  UnreadStreamItem,
  UnreadTopicItem,
  UserOrBot,
} from '../types';
import { connect } from '../react-redux';
import { SearchEmptyState } from '../common';
import PmConversationList from '../pm-conversations/PmConversationList';
import StreamItem from '../streams/StreamItem';
import TopicItem from '../streams/TopicItem';
import { streamNarrow, topicNarrow } from '../utils/narrow';
import {
  getUnreadConversations,
  getAllUsersByEmail,
  getUnreadStreamsAndTopicsSansMuted,
} from '../selectors';
import { doNarrow } from '../actions';

type Props = $ReadOnly<{|
  conversations: PmConversationData[],
  dispatch: Dispatch,
  usersByEmail: Map<string, UserOrBot>,
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
    const { conversations, unreadStreamsAndTopics, ...restProps } = this.props;
    type UnreadPmItem = $PropertyType<PmConversationList, 'props'>;
    type UnreadPmSection = $ReadOnly<{| key: 'private', data: $ReadOnlyArray<UnreadPmItem> |}>;
    type Card = UnreadStreamItem | UnreadPmSection;

    /* eslint-disable no-unused-expressions */
    (unreadStreamsAndTopics[0]: $ReadOnly<SectionBase<mixed>>);
    (x: UnreadStreamItem): $ReadOnly<SectionBase<UnreadTopicItem>> => x;
    (x: UnreadPmSection): $ReadOnly<SectionBase<UnreadPmItem>> => x;
    (x: Card): $ReadOnly<SectionBase<UnreadTopicItem | UnreadPmItem>> => x;
    (
      x: $ReadOnly<SectionBase<UnreadTopicItem | UnreadPmItem>>,
    ): SectionBase<UnreadTopicItem | UnreadPmItem> => x;

    const unreadCards: $ReadOnlyArray<Card> = [
      {
        key: 'private',
        data: [{ conversations, ...restProps }],
      },
      ...(unreadStreamsAndTopics: $ReadOnlyArray<UnreadStreamItem>),
    ];

    if (unreadStreamsAndTopics.length === 0 && conversations.length === 0) {
      return <SearchEmptyState text="No unread messages" />;
    }

    return (
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
              isMuted={section.isMuted}
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
              isMuted={section.isMuted || item.isMuted}
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

export default connect(state => ({
  conversations: getUnreadConversations(state),
  usersByEmail: getAllUsersByEmail(state),
  unreadStreamsAndTopics: getUnreadStreamsAndTopicsSansMuted(state),
}))(UnreadCards);
