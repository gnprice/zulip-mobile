/* @flow */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';

import type { Dispatch, GlobalState, User } from '../types';
import { getOwnUser } from '../selectors';
import AccountDetails from './AccountDetails';

const componentStyles = StyleSheet.create({
  accountButtons: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginHorizontal: 8,
  },
});

type Props = {|
  ownUser: User,
|};

class OwnAccountCard extends PureComponent<Props> {
  render() {
    const { ownUser } = this.props;

    return (
      <View>
        <AccountDetails user={ownUser} />
        <View style={componentStyles.accountButtons} />
      </View>
    );
  }
}

export default connect((state: GlobalState, props: Object) => ({
  ownUser: getOwnUser(state),
}))(OwnAccountCard);
