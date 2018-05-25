/* @flow */
import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import type { Context, PresenceState, User } from '../types';
import { Avatar, ViewPlaceholder } from '../common';
import ActivityText from './ActivityText';

type Props = {
  user: User,
  color: string,
  presence: PresenceState,
};

export default class TitlePrivate extends PureComponent<Props> {
  context: Context;
  props: Props;

  static contextTypes = {
    styles: () => null,
  };

  render() {
    const { styles } = this.context;
    const { user, color, presence } = this.props;

    return (
      <View style={styles.navWrapper}>
        <Avatar
          size={32}
          name={user.full_name}
          email={user.email}
          avatarUrl={user.avatar_url}
          presence={presence[user.email]}
        />
        <ViewPlaceholder width={8} />
        <View>
          <Text
            style={[styles.navTitle, { color }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.full_name}
          </Text>
          <ActivityText
            style={styles.navSubtitle}
            color={color}
            email={user.email}
          />
        </View>
      </View>
    );
  }
}
