/* @flow strict-local */

import React, { PureComponent } from 'react';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { getAccountStatuses } from '../selectors';
import type { AccountStatus } from './accountsSelectors';
import { Centerer, ZulipButton, Logo, Screen } from '../common';
import AccountList from './AccountList';
import { navigateToRealmScreen, removeAccount } from '../actions';

type Props = {|
  accounts: AccountStatus[],
  dispatch: Dispatch,
|};

class AccountPickScreen extends PureComponent<Props> {
  handleAccountSelect = (index: number) => {
  };

  handleAccountRemove = (index: number) => {
    this.props.dispatch(removeAccount(index));
  };

  render() {
    const { accounts, dispatch } = this.props;

    return (
      <Screen title="Pick account" centerContent padding canGoBack={false}>
        <Centerer>
          {accounts.length === 0 && <Logo />}
          <AccountList
            accounts={accounts}
            onAccountSelect={this.handleAccountSelect}
            onAccountRemove={this.handleAccountRemove}
          />
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
