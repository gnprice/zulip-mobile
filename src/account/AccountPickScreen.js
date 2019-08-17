/* @flow strict-local */

import React, { PureComponent } from 'react';
import { View, FlatList } from 'react-native';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { getAccountStatuses } from '../selectors';
import type { AccountStatus } from './accountsSelectors';
import { Centerer, ZulipButton, Logo, Screen } from '../common';
import { navigateToRealmScreen, removeAccount } from '../actions';
import AccountItem from './AccountItem';

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
      <Screen title="Pick account" centerContent padding canGoBack={false}>
        <Centerer>
            {accounts.length === 0 && <Logo />}
      <View>
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
            <ZulipButton
	style={{marginTop: 16}}
            text="Add new account"
            onPress={() => {
              dispatch(navigateToRealmScreen());
            }}
          />
        </Centerer>
      </Screen>
    );
  }
}

export default connect(state => ({
  accounts: getAccountStatuses(state),
}))(AccountPickScreen);
