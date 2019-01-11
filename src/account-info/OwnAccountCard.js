/* @flow */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';

import type { Dispatch, GlobalState, User, PresenceState } from '../types';
import { getOwnUser, getPresence } from '../selectors';
import AccountDetails from './AccountDetails';
import SwitchAccountButton from '../account-info/SwitchAccountButton';
import LogoutButton from '../account-info/LogoutButton';

const componentStyles = StyleSheet.create({
  accountButtons: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginHorizontal: 8,
  },
});

type Props = {|
  ownUser: User,
  dispatch: Dispatch,
  presence: PresenceState,
|};

class OwnAccountCard extends PureComponent<Props> {
  render() {
    const { dispatch, ownUser, presence } = this.props;

    return (
      <View>
        <AccountDetails dispatch={dispatch} user={ownUser} presence={presence[ownUser.email]} />
        <View style={componentStyles.accountButtons}>
          <SwitchAccountButton />
          <LogoutButton />
        </View>
      </View>
    );
  }
}

export default connect((state: GlobalState, props: Object) => ({
  ownUser: getOwnUser(state),
  presence: getPresence(state),
}))(OwnAccountCard);
