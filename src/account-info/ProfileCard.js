/* @flow strict-local */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { ZulipButton } from '../common';
import {
  logout,
} from '../actions';

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: 8,
  },
  button: {
    flex: 1,
    margin: 8,
  },
});

class LogoutButton extends PureComponent<{| dispatch: Dispatch |}> {
  onPress = () => {
    const { dispatch } = this.props;
    dispatch(logout());
  };

  render() {
    return <ZulipButton style={styles.button} secondary text="Log out" onPress={this.onPress} />;
  }
}

type Props = {|
  dispatch: Dispatch,
|};

/**
 * This is similar to `AccountDetails` but used to show the current users account.
 * It does not have a "Send private message" but has "Switch account" and "Log out" buttons.
 *
 * The user can still open `AccountDetails` on themselves via the (i) icon in a chat screen.
 */
class ProfileCard extends PureComponent<Props> {
  render() {
    return (
      <View style={styles.buttonRow}>
        <LogoutButton dispatch={this.props.dispatch} />
      </View>
    );
  }
}

export default connect()(ProfileCard);
