/* @flow strict-local */

import type { AppNavigatorParamList } from './AppNavigator';
import type { SharingNavigatorParamList } from '../sharing/SharingScreen';
import type { StreamTabsNavigatorParamList } from '../main/StreamTabsScreen';
import type { MainTabsNavigatorParamList } from '../main/MainTabsScreen';

export type GlobalParamList = $ReadOnly<{|
  ...AppNavigatorParamList,
  ...SharingNavigatorParamList,
  ...StreamTabsNavigatorParamList,
  ...MainTabsNavigatorParamList,
|}>;
