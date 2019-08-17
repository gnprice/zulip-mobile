/* @flow strict-local */
import React, { PureComponent } from 'react';

import { Screen } from '../common';
import ProfileCard from '../account-info/ProfileCard';

export default class MainScreenWithTabs extends PureComponent<{}> {
  render() {
    return (
      <Screen>
        <ProfileCard />
      </Screen>
    );
  }
}
