/* @flow strict-local */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';

import type { UserOrBot } from '../types';
import { UserAvatarWithPresence, RawLabel, Touchable, UnreadCount } from '../common';
import styles, { BRAND_COLOR } from '../styles';

const componentStyles = StyleSheet.create({
  selectedRow: {
    backgroundColor: BRAND_COLOR,
  },
  text: {
    marginLeft: 16,
  },
  selectedText: {
    color: 'white',
  },
  textEmail: {
    fontSize: 10,
    color: 'hsl(0, 0%, 60%)',
  },
  textWrapper: {
    flex: 1,
  },
});

type Props = $ReadOnly<{|
  user: UserOrBot,
  isSelected: boolean,
  showEmail: boolean,
  unreadCount?: number,
  onPress: UserOrBot => void,
|}>;

export default class UserItem extends PureComponent<Props> {
  static defaultProps = {
    isSelected: false,
    showEmail: false,
  };

  handlePress = () => {
    const { user, onPress } = this.props;
    if (user && onPress) {
      onPress(user);
    }
  };

  render() {
    const { user, isSelected, unreadCount, showEmail } = this.props;

    return (
      <Touchable onPress={this.handlePress}>
        <View style={[styles.listItem, isSelected && componentStyles.selectedRow]}>
          <UserAvatarWithPresence
            size={48}
            avatarUrl={user.avatar_url}
            email={user.email}
            onPress={this.handlePress}
          />
          <View style={componentStyles.textWrapper}>
            <RawLabel
              style={[componentStyles.text, isSelected && componentStyles.selectedText]}
              text={user.full_name}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
            {showEmail && (
              <RawLabel
                style={[
                  componentStyles.text,
                  componentStyles.textEmail,
                  isSelected && componentStyles.selectedText,
                ]}
                text={user.email}
                numberOfLines={1}
                ellipsizeMode="tail"
              />
            )}
          </View>
          <UnreadCount count={unreadCount} inverse={isSelected} />
        </View>
      </Touchable>
    );
  }
}
