/* @flow strict-local */

import React, { PureComponent } from 'react';
import { View, FlatList } from 'react-native';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { Centerer, Screen } from '../common';
import { removeAccount } from '../actions';
import AccountItem from './AccountItem';
import { RealmInput } from '../start/RealmScreen';

type Props = {|
  accounts: string[],
  dispatch: Dispatch,
|};

class AccountPickScreen extends PureComponent<Props> {
  handleAccountRemove = (index: number) => {
    this.props.dispatch(removeAccount(index));
  };

  render() {
    const { accounts } = this.props;

    return (
      <Screen title="Items" centerContent padding>
        <Centerer>

          <RealmInput />

          <View style={{ marginTop: 16 }}>
            <FlatList
              data={accounts}
              keyExtractor={item => item}
              renderItem={({ item, index }) => (
                <AccountItem
                  index={index}
                  realm={item}
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
    accounts: state.accounts.map<string>(({ realm }) => realm),
}))(AccountPickScreen);
