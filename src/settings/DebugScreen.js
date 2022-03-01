/* @flow strict-local */

import React from 'react';
import type { Node } from 'react';
import { View } from 'react-native';

import type { NavProps } from '../react-navigation';
import Screen from '../common/Screen';

type Props = $ReadOnly<{|
  ...NavProps<'debug', void>,
|}>;

export default function DebugScreen(props: Props): Node {
  return (
    <Screen title="Debug">
      <View />
    </Screen>
  );
}
