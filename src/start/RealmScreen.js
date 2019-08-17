/* @flow strict-local */
import React, { PureComponent } from 'react';
import { ScrollView, TextInput, Keyboard, View } from 'react-native';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { Screen, ZulipButton } from '../common';
import { loginSuccess } from '../actions';
import styles from '../styles';

type Props = {|
  dispatch: Dispatch,
|};

type State = {|
  realm: string,
|};

class RealmInputInner extends PureComponent<Props, State> {
  state = {
    realm: '',
  };

  scrollView: ScrollView;

  tryRealm = async () => {
    const { realm } = this.state;
    const { dispatch } = this.props;
	const fetchedKey = {email: 'x@y.z', api_key: '012345abcd'};
	dispatch(loginSuccess(realm, fetchedKey.email, fetchedKey.api_key));
      Keyboard.dismiss();
  };

  handleRealmChange = (value: string) => this.setState({ realm: value });

  render() {
    const { realm } = this.state;

      return (
	  <View>
	      <TextInput
	  style={{borderWidth: 1, padding: 8}}
	autoFocus
	autoCapitalize="none"
          onChangeText={this.handleRealmChange}
          onSubmitEditing={this.tryRealm}
          enablesReturnKeyAutomatically
/>
        <ZulipButton
          style={styles.halfMarginTop}
          text="Add"
          progress={false}
          onPress={this.tryRealm}
      disabled={false}
        />
	      </View>
      )
  }
}

export const RealmInput = connect()(RealmInputInner);
