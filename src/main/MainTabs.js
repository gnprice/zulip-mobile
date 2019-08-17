/* @flow strict-local */
import React from 'react';
import { Platform } from 'react-native';
import { TabNavigator, TabBarBottom } from 'react-navigation';

import type { TabNavigationOptionsPropsType } from '../types';
import tabsOptions from '../styles/tabs';
import HomeTab from './HomeTab';
import StreamTabs from './StreamTabs';
import PmConversationsCard from '../pm-conversations/PmConversationsCard';
import SettingsCard from '../settings/SettingsCard';
import { IconInbox, IconSettings, IconStream } from '../common/Icons';
import { OwnAvatar } from '../common';
import IconUnreadConversations from '../nav/IconUnreadConversations';
import ProfileCard from '../account-info/ProfileCard';

export default TabNavigator(
  {
    profile: {
      // $FlowFixMe react-navigation types are twisty and seem wrong
      screen: ProfileCard,
      navigationOptions: {
        tabBarLabel: 'Profile',
        tabBarIcon: (props: TabNavigationOptionsPropsType) => <OwnAvatar size={24} />,
      },
    },
  },
  {
    backBehavior: 'none',
    tabBarComponent: TabBarBottom,
    tabBarPosition: 'bottom',
    ...tabsOptions({
      showLabel: !!Platform.isPad,
      showIcon: true,
    }),
  },
);
