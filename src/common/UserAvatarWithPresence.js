/* @flow strict-local */
import React, { PureComponent } from 'react';

import type { UserId } from '../types';
import { createStyleSheet } from '../styles';
import UserAvatar from './UserAvatar';
import PresenceStatusIndicator from './PresenceStatusIndicator';
import { AvatarURL } from '../utils/avatar';
import { tryGetUserForId } from '../users/userSelectors';
import { useSelector } from '../react-redux';

const styles = createStyleSheet({
  status: {
    bottom: 0,
    right: 0,
    position: 'absolute',
  },
});

type Props = $ReadOnly<{|
  userId: UserId,
  avatarUrl: AvatarURL,
  size: number,
  onPress?: () => void,
|}>;

/**
 * A user avatar with a PresenceStatusIndicator in the corner.
 *
 * Prefer `UserAvatarWithPresenceById` over this component: it does the same
 * thing but provides a more encapsulated interface.  Once all callers
 * have migrated to that version, it'll replace this one.
 *
 * @prop [size] - Sets width and height in logical pixels.
 * @prop [onPress] - Event fired on pressing the component.
 */
export default class UserAvatarWithPresence extends PureComponent<Props> {
  render() {
    const { avatarUrl, userId, size, onPress } = this.props;

    return (
      <UserAvatar avatarUrl={avatarUrl} size={size} onPress={onPress}>
        <PresenceStatusIndicator
          style={styles.status}
          userId={userId}
          hideIfOffline
          useOpaqueBackground
        />
      </UserAvatar>
    );
  }
}

/**
 * A user avatar with a PresenceStatusIndicator in the corner.
 *
 * Use this in preference to the default export `UserAvatarWithPresence`.
 * We're migrating from that one to this for better encapsulation.
 */
export function UserAvatarWithPresenceById(props: $ReadOnly<$Diff<Props, {| avatarUrl: mixed |}>>) {
  const { userId } = props;

  const user = useSelector(state => tryGetUserForId(state, userId));
  if (!user) {
    // This condition really does happen, because UserItem can be passed a fake
    // pseudo-user by PeopleAutocomplete, to represent `@all` or `@everyone`.
    // TODO eliminate that, and use plain `getUserForId` here.
    return null;
  }

  return <UserAvatarWithPresence {...props} avatarUrl={user.avatar_url} />;
}
