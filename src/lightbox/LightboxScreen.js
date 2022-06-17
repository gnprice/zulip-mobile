/* @flow strict-local */
import React from 'react';
import type { Node } from 'react';
import { LogBox, View } from 'react-native';

import type { Message } from '../types';
import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import { createStyleSheet } from '../styles';
import Lightbox from './Lightbox';

const styles = createStyleSheet({
  screen: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: 'black',
  },
});

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'lightbox'>,
  route: RouteProp<'lightbox', {| src: string, message: Message |}>,
|}>;

// React Navigation would give us a console warning about non-serializable
// route params. For more about the warning, see
//   https://reactnavigation.org/docs/5.x/troubleshooting/#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state
//
// In general, we don't persist navigation state, so it's fine that there's
// an AvatarURL instance in this screen's route params.  If we wanted to
// make it serializable, and so compatible with persisting nav state, we
// could do so by taking only a message ID and looking up the actual message
// in Redux.
LogBox.ignoreLogs([
  /^Non-serializable values were found in the navigation state\..*\nlightbox > \S+\.avatar_url\b/s,
]);

export default function LightboxScreen(props: Props): Node {
  const { src, message } = props.route.params;

  return (
    <View style={styles.screen}>
      <Lightbox src={src} message={message} />
    </View>
  );
}
