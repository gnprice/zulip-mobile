/* @flow strict-local */
import React, { useContext } from 'react';
import type { Node } from 'react';
import {
  createBottomTabNavigator,
  type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ParamListBase, NavigationProp } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/core/lib/typescript/src/types';

import type { RouteProp, RouteParamsOf } from '../react-navigation';
import { getUnreadHuddlesTotal, getUnreadPmsTotal } from '../selectors';
import { useSelector } from '../react-redux';
import type { AppNavigationMethods, AppNavigationProp } from '../nav/AppNavigator';
import { bottomTabNavigatorConfig } from '../styles/tabs';
import HomeScreen from './HomeScreen';
import StreamTabsScreen from './StreamTabsScreen';
import PmConversationsScreen from '../pm-conversations/PmConversationsScreen';
import { IconInbox, IconStream, IconPeople } from '../common/Icons';
import OwnAvatar from '../common/OwnAvatar';
import OfflineNotice from '../common/OfflineNotice';
import ProfileScreen from '../account-info/ProfileScreen';
import styles, { BRAND_COLOR, ThemeContext } from '../styles';

export type MainTabsNavigatorParamList = {|
  +home: RouteParamsOf<typeof HomeScreen>,
  +'stream-tabs': RouteParamsOf<typeof StreamTabsScreen>,
  +'pm-conversations': RouteParamsOf<typeof PmConversationsScreen>,
  +profile: RouteParamsOf<typeof ProfileScreen>,
|};

/* eslint-disable */

export type MainTabsNavigationProp<
  +RouteName: $Keys<MainTabsNavigatorParamList> = $Keys<MainTabsNavigatorParamList>,
> =
  // Screens on this navigator will get a `navigation` prop that reflects
  // this navigator itself…
  BottomTabNavigationProp<MainTabsNavigatorParamList, RouteName> &
    // … plus the methods it gets from its parent navigator.
    AppNavigationMethods;

// Trying to define it this way fails (with the errors appearing where
// MainTabsNavigationProp gets instantiated, at those screens that actually
// go on to use a value of that type):
//   CompositeNavigationProp<
//     BottomTabNavigationProp<MainTabsNavigatorParamList, RouteName>,
//     AppNavigationProp<>,
//   >;
//
// The reason is (though the Flow error messages are not good) that the
// bounds on CompositeNavigationProp aren't met.
//
// In particular, this errors -- BottomTabNavigationProp can't flow to
// NavigationProp:
(
  n: BottomTabNavigationProp<{| +home: void |}, 'home'>,
): NavigationProp<ParamListBase, string, $FlowFixMe, $FlowFixMe, $FlowFixMe> => n;
//
// These don't, though:
(n: MainTabsNavigatorParamList): ParamListBase => n;
(n: {| +home: void |}): ParamListBase => n;
// so the problem isn't that piece.

const Tab = createBottomTabNavigator<
  MainTabsNavigatorParamList,
  MainTabsNavigatorParamList,
  MainTabsNavigationProp<>,
>();

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'main-tabs'>,
  route: RouteProp<'main-tabs', void>,
|}>;

export default function MainTabsScreen(props: Props): Node {
  const { backgroundColor } = useContext(ThemeContext);

  const unreadPmsCount = useSelector(getUnreadHuddlesTotal) + useSelector(getUnreadPmsTotal);

  return (
    <SafeAreaView mode="padding" edges={['top']} style={[styles.flexed, { backgroundColor }]}>
      <OfflineNotice />
      <Tab.Navigator {...bottomTabNavigatorConfig()} lazy={false} backBehavior="none">
        <Tab.Screen
          name="home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <IconInbox size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="stream-tabs"
          component={StreamTabsScreen}
          options={{
            tabBarLabel: 'Streams',
            tabBarIcon: ({ color }) => <IconStream size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="pm-conversations"
          component={PmConversationsScreen}
          options={{
            tabBarLabel: 'Conversations',
            tabBarIcon: ({ color }) => <IconPeople size={24} color={color} />,
            tabBarBadge: unreadPmsCount > 0 ? unreadPmsCount : undefined,
            tabBarBadgeStyle: {
              color: 'white',
              backgroundColor: BRAND_COLOR,
            },
          }}
        />
        <Tab.Screen
          name="profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => <OwnAvatar size={24} />,
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
