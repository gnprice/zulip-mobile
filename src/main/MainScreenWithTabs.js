/* @flow strict-local */
import React, { PureComponent } from 'react';
import { View } from 'react-native';

import type { Context } from '../types';
import { Screen } from '../common';
import ProfileCard from '../account-info/ProfileCard';
import styles from '../styles';

export default class MainScreenWithTabs extends PureComponent<{}> {
  context: Context;

  static contextTypes = {
    styles: () => null,
  };

  render() {
    const { styles: contextStyles } = this.context;

    return (
      <Screen>
        <ProfileCard />
      </Screen>
    );
  }
}
