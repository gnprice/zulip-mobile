/* @flow strict-local */
import { StackNavigator } from 'react-navigation';

import AccountPickScreen from '../account/AccountPickScreen';
import RealmScreen from '../start/RealmScreen';
import AuthScreen from '../start/AuthScreen';
import DevAuthScreen from '../start/DevAuthScreen';
import MainScreenWithTabs from '../main/MainScreenWithTabs';
import LoadingScreen from '../start/LoadingScreen';
import PasswordAuthScreen from '../start/PasswordAuthScreen';
import WelcomeHelpScreen from '../start/WelcomeHelpScreen';
import WelcomeScreen from '../start/WelcomeScreen';

export default StackNavigator(
  // $FlowFixMe react-navigation types :-/ -- see a36814e80
  {
    account: { screen: AccountPickScreen },
    auth: { screen: AuthScreen },
    dev: { screen: DevAuthScreen },
    loading: { screen: LoadingScreen },
    main: { screen: MainScreenWithTabs },
    password: { screen: PasswordAuthScreen },
    realm: { screen: RealmScreen },
    'welcome-help': { screen: WelcomeHelpScreen },
    welcome: { screen: WelcomeScreen },
  },
  {
    initialRouteName: 'main',
    headerMode: 'none',
    cardStyle: {
      backgroundColor: 'white',
    },
  },
);
