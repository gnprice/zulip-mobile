/* @flow strict-local */
import React, { PureComponent } from 'react';
import { SafeAreaView } from 'react-native';

import type { Context } from '../types';
import { OfflineNotice, ZulipStatusBar } from '../common';
import { StatusBarConfig } from '../common/ZulipStatusBar';
import MainTabs from './MainTabs';
import styles from '../styles';

export default class MainScreenWithTabs extends PureComponent<{}> {
  context: Context;

  static contextTypes = {
    styles: () => null,
  };

  render() {
    const { styles: contextStyles } = this.context;

    return (
      <SafeAreaView style={[styles.flexed, contextStyles.backgroundColor]}>
	<StatusBarConfig />
        <OfflineNotice />
        <MainTabs />
      </SafeAreaView>
    );
  }
}
