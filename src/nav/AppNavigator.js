/* @flow strict-local */
import { StackNavigator } from 'react-navigation';

import AccountPickScreen from '../account/AccountPickScreen';
import LoadingScreen from '../start/LoadingScreen';

export default StackNavigator(
  // $FlowFixMe react-navigation types :-/ -- see a36814e80
  {
    account: { screen: AccountPickScreen },
    loading: { screen: LoadingScreen },
  },
  {
    initialRouteName: 'account',
    headerMode: 'none',
    cardStyle: {
      backgroundColor: 'white',
    },
  },
);
