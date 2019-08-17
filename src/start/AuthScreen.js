/* @flow strict-local */

import React, { PureComponent } from 'react';
import { Linking } from 'react-native';
import parseURL from 'url-parse';

import type { Dispatch } from '../types';
import { connect } from '../react-redux';
import { Centerer, Screen } from '../common';
import { getCurrentRealm } from '../selectors';
import AuthButton from './AuthButton';
import { extractApiKey } from '../utils/encoding';
import { activeAuthentications } from './authentications';
import { loginSuccess, navigateToPassword } from '../actions';

type Props = {|
  dispatch: Dispatch,
  realm: string,
|};

let otp = '';

/**
 * An event emitted by `Linking`.
 *
 * Determined by reading the implementation source code, and documentation:
 *   https://facebook.github.io/react-native/docs/linking
 *
 * TODO move this to a libdef, and/or get an explicit type into upstream.
 */
type LinkingEvent = {
  url: string,
};

class AuthScreen extends PureComponent<Props> {
  componentDidMount = () => {
      const authList = activeAuthentications({password: true});
    if (authList.length === 1) {
      // $FlowFixMe
      this[authList[0].handler]();
    }
  };

  handlePassword = () => {
      this.props.dispatch(navigateToPassword(true));
  };

  render() {
    return (
      <Screen title="Log in" centerContent padding>
        <Centerer>
            {activeAuthentications({password: true}).map(auth => (
            <AuthButton
              key={auth.method}
              name={auth.name}
              Icon={auth.Icon}
              onPress={
                // $FlowFixMe
                this[auth.handler]
              }
            />
          ))}
        </Centerer>
      </Screen>
    );
  }
}

export default connect(state => ({
  realm: getCurrentRealm(state),
}))(AuthScreen);
