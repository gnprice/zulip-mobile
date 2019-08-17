/* @flow strict-local */

import React, { PureComponent } from 'react';
import { View, FlatList } from 'react-native';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { getAccountStatuses } from '../selectors';
import type { AccountStatus } from './accountsSelectors';
import { Centerer, ZulipButton, Logo, Screen } from '../common';
import { removeAccount } from '../actions';
import AccountItem from './AccountItem';
import { RealmInput } from '../start/RealmScreen';

type Props = {|
  accounts: AccountStatus[],
  dispatch: Dispatch,
|};

class AccountPickScreen extends PureComponent<Props> {
  handleAccountRemove = (index: number) => {
    this.props.dispatch(removeAccount(index));
  };

  render() {
    const { accounts, dispatch } = this.props;

    return (
      <Screen title="Items" centerContent padding canGoBack={false}>
        <Centerer>

	<RealmInput />

	    <View style={{marginTop: 16}}>
        <FlatList
          data={accounts}
          keyExtractor={item => item.realm}
          renderItem={({ item, index }) => (
            <AccountItem
              index={index}
              realm={item.realm}
              onRemove={this.handleAccountRemove}
            />
          )}
        />
      </View>
        </Centerer>
      </Screen>
    );
  }
}

export default connect(state => ({
  accounts: getAccountStatuses(state),
}))(AccountPickScreen);
