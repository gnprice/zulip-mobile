/* @flow strict-local */

import React, { PureComponent } from 'react';
import type { TextStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

import type { User, UserPresence, UserStatus, Dispatch } from '../types';
import { connect } from '../react-redux';
import { getPresence, getUserStatus } from '../selectors';
import { presenceToHumanTime } from '../utils/presence';
import { RawLabel } from '../common';

type SelectorProps = {|
  presence: UserPresence,
  userStatus: UserStatus,
|};

type Props = {|
  dispatch: Dispatch,
  style: TextStyleProp,
  user: User,
  ...SelectorProps,
|};

class ActivityText extends PureComponent<Props> {
  render() {
    const { style, presence, userStatus } = this.props;

    if (!presence) {
      return null;
    }

    const activity = presenceToHumanTime(presence, userStatus);

    return <RawLabel style={style} text={`Active ${activity}`} />;
  }
}

export default connect((state, props): SelectorProps => ({
  presence: getPresence(state)[props.user.email],
  userStatus: getUserStatus(state)[props.user.user_id],
}))(ActivityText);
