/* @flow strict-local */
import React from 'react';
import { FlatList } from 'react-native';
import { useSelector } from '../react-redux';

import type { Dispatch, PmConversationData, UserOrBot } from '../types';
import { createStyleSheet } from '../styles';
import { type PmKeyUsers } from '../utils/recipient';
import { pm1to1NarrowFromUser, pmNarrowFromUsers } from '../utils/narrow';
import UserItem from '../users/UserItem';
import GroupPmConversationItem from './GroupPmConversationItem';
import { doNarrow } from '../actions';
import { getMutedUsers } from '../selectors';

const styles = createStyleSheet({
  list: {
    flex: 1,
    flexDirection: 'column',
  },
});

type Props = $ReadOnly<{|
  dispatch: Dispatch,
  conversations: PmConversationData[],
|}>;

/**
 * A list describing all PM conversations.
 * */
export default function PmConversationList(props: Props) {
  const handleUserNarrow = (user: UserOrBot) => {
    props.dispatch(doNarrow(pm1to1NarrowFromUser(user)));
  };

  const handleGroupNarrow = (users: PmKeyUsers) => {
    props.dispatch(doNarrow(pmNarrowFromUsers(users)));
  };

  const { conversations } = props;
  const mutedUsers = useSelector(getMutedUsers);

  return (
    <FlatList
      style={styles.list}
      initialNumToRender={20}
      data={conversations}
      keyExtractor={item => item.key}
      renderItem={({ item }) => {
        const users = item.keyRecipients;
        if (users.length === 1) {
          if (mutedUsers.has(users[0].user_id)) {
            return null;
          } else {
            return (
              <UserItem
                userId={users[0].user_id}
                unreadCount={item.unread}
                onPress={handleUserNarrow}
              />
            );
          }
        } else {
          return (
            <GroupPmConversationItem
              users={users}
              unreadCount={item.unread}
              onPress={handleGroupNarrow}
            />
          );
        }
      }}
    />
  );
}
