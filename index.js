/* @flow strict-local */
import { AppRegistry } from 'react-native';
// $FlowFixMe[untyped-import]
import { enableScreens } from 'react-native-screens';

import ZulipMobile from './src/ZulipMobile';

enableScreens(false);
AppRegistry.registerComponent('ZulipMobile', () => ZulipMobile);
