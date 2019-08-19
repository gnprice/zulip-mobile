/* @flow strict-local */

import React, { PureComponent } from 'react';
import { Text, View, FlatList, NativeModules } from 'react-native';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { Centerer, RawLabel, Screen } from '../common';
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

      const info = NativeModules.TextCompressionModule === undefined
	    ? 'undefined'
	    : NativeModules.TextCompressionModule === null
	    ? 'null'
	    : 'other';

    return (
      <Screen title="Items" centerContent padding>
        <Centerer>

	    <Text style={{margin: 16}}>{info}</Text>

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
