/* @flow strict-local */
import React, { PureComponent } from 'react';
import { ScrollView, TextInput, Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';

import type { Dispatch } from '../types';
import { connectFlowFixMe } from '../react-redux';
import { ErrorMsg, Label, Screen, ZulipButton } from '../common';
import { isValidUrl } from '../utils/url';
import { realmAdd, loginSuccess } from '../actions';
import styles from '../styles';

type Props = {|
  dispatch: Dispatch,
  navigation: NavigationScreenProp<mixed>,
  initialRealm: string,
|};

type State = {|
  realm: string,
  error: string | null,
  progress: boolean,
|};

class RealmScreen extends PureComponent<Props, State> {
  state = {
    progress: false,
    realm: this.props.initialRealm,
    error: null,
  };

  scrollView: ScrollView;

  tryRealm = async () => {
    const { realm } = this.state;

    this.setState({
      realm,
      progress: true,
      error: null,
    });

    const { dispatch } = this.props;

    try {
	dispatch(realmAdd(realm));
	const fetchedKey = {email: 'x@y.z', api_key: '012345abcd'};
	dispatch(loginSuccess(realm, fetchedKey.email, fetchedKey.api_key));
      Keyboard.dismiss();
    } catch (err) {
      this.setState({ error: 'Cannot connect to server' });
    } finally {
      this.setState({ progress: false });
    }
  };

  handleRealmChange = (value: string) => this.setState({ realm: value });

  render() {
    const { initialRealm, navigation } = this.props;
    const { progress, error, realm } = this.state;

    return (
      <Screen title="Welcome" padding centerContent keyboardShouldPersistTaps="always">
	    <TextInput
	autoFocus
	autoCapitalize="none"
          onChangeText={this.handleRealmChange}
          onSubmitEditing={this.tryRealm}
          enablesReturnKeyAutomatically
/>
        {error !== null && <ErrorMsg error={error} />}
        <ZulipButton
          style={styles.halfMarginTop}
          text="Enter"
          progress={progress}
          onPress={this.tryRealm}
      disabled={false}
        />
      </Screen>
    );
  }
}

export default connectFlowFixMe((state, props) => ({
    initialRealm: '',
}))(RealmScreen);
