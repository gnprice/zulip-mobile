/* @flow strict-local */
import React from 'react';
import type { Node } from 'react';
import { FlatList } from 'react-native';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import Screen from '../common/Screen';
import InfoItem from './InfoItem';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'variables'>,
  route: RouteProp<'variables', void>,
|}>;

export default function VariablesScreen(props: Props): Node {
  const variables = {
    'process.env.NODE_ENV': process.env.NODE_ENV ?? '(not defined)',
  };

  return (
    <Screen title="Variables" scrollEnabled={false}>
      <FlatList
        data={Object.keys(variables)}
        keyExtractor={item => item}
        renderItem={({ item }) => <InfoItem label={item} value={variables[item]} />}
      />
    </Screen>
  );
}
