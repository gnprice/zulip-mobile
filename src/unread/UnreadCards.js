/* @flow strict-local */

import React from 'react';
import { SectionList } from 'react-native';

import type { UnreadStreamItem } from '../types';
import { useDispatch, useSelector } from '../react-redux';
import { SearchEmptyState } from '../common';
import PmConversationList from '../pm-conversations/PmConversationList';
import StreamItem from '../streams/StreamItem';
import TopicItem from '../streams/TopicItem';
import { streamNarrow, topicNarrow } from '../utils/narrow';
import { getUnreadConversations, getUnreadStreamsAndTopics } from '../selectors';
import { doNarrow } from '../actions';

type Props = $ReadOnly<{||}>;

export default function UnreadCards(props: Props) {
  const dispatch = useDispatch();
  const conversations = useSelector(getUnreadConversations);
  const unreadStreamsAndTopics = useSelector(getUnreadStreamsAndTopics);
  type Card =
    | UnreadStreamItem
    | {| key: 'private', data: Array<React$ElementConfig<typeof PmConversationList>> |};
  const unreadCards: Array<Card> = [
    {
      key: 'private',
      data: [{ conversations }],
    },
    ...unreadStreamsAndTopics,
  ];

  if (unreadStreamsAndTopics.length === 0 && conversations.length === 0) {
    return <SearchEmptyState text="No unread messages" />;
  }

  return (
    // $FlowFixMe[incompatible-type-arg]
    /* $FlowFixMe[prop-missing]
       SectionList libdef seems confused; should take $ReadOnly objects. */
    <SectionList
      stickySectionHeadersEnabled
      initialNumToRender={20}
      sections={unreadCards}
      keyExtractor={item => item.key}
      renderSectionHeader={({ section }) => {
        if (section.key === 'private') {
          return null;
        }
        const { subscription } = section;
        return (
          <StreamItem
            name={subscription.name}
            iconSize={16}
            isMuted={!subscription.in_home_view}
            isPrivate={subscription.invite_only}
            backgroundColor={subscription.color}
            unreadCount={section.unread}
            onPress={(stream: string) => {
              setTimeout(() => dispatch(doNarrow(streamNarrow(stream))));
            }}
          />
        );
      }}
      renderItem={({ item, section }) => {
        if (section.key === 'private') {
          return <PmConversationList {...item} />;
        }
        const { subscription } = section;
        return (
          <TopicItem
            name={item.topic}
            stream={subscription.name || ''}
            isMuted={
              // We can't efficiently check this here; but if the topic were
              // muted, it'd have been filtered out of this data.
              false
            }
            isSelected={false}
            unreadCount={item.unread}
            onPress={(stream: string, topic: string) => {
              setTimeout(() => dispatch(doNarrow(topicNarrow(stream, topic))));
            }}
          />
        );
      }}
    />
  );
}
