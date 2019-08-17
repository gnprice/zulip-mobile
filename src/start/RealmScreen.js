/* @flow strict-local */
import React, { PureComponent } from 'react';
import { ScrollView, TextInput, Keyboard } from 'react-native';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { Screen, ZulipButton } from '../common';
import { realmAdd, loginSuccess } from '../actions';
import styles from '../styles';

type Props = {|
  dispatch: Dispatch,
|};

type State = {|
  realm: string,
|};

class RealmScreen extends PureComponent<Props, State> {
  state = {
    realm: '',
  };

  scrollView: ScrollView;

  tryRealm = async () => {
    const { realm } = this.state;
    const { dispatch } = this.props;
	dispatch(realmAdd(realm));
	const fetchedKey = {email: 'x@y.z', api_key: '012345abcd'};
	dispatch(loginSuccess(realm, fetchedKey.email, fetchedKey.api_key));
      Keyboard.dismiss();
  };

  handleRealmChange = (value: string) => this.setState({ realm: value });

  render() {
    const { realm } = this.state;

    return (
      <Screen title="Welcome" padding centerContent keyboardShouldPersistTaps="always">
	    <TextInput
	autoFocus
	autoCapitalize="none"
          onChangeText={this.handleRealmChange}
          onSubmitEditing={this.tryRealm}
          enablesReturnKeyAutomatically
/>
        <ZulipButton
          style={styles.halfMarginTop}
          text="Enter"
          progress={false}
          onPress={this.tryRealm}
      disabled={false}
        />
      </Screen>
    );
  }
}

export default connect()(RealmScreen);
