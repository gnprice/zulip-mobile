/* @flow strict-local */
import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';

import NavigationService from '../nav/NavigationService';
import type { SharedData } from '../types';
import { navigateToSharing } from '../actions';

const Sharing = NativeModules.Sharing ?? {
  getInitialSharedContent: () =>
    // TODO: Implement on iOS.
    null,
};

export const handleInitialShare = async () => {
  const initialSharedData: SharedData | null = await Sharing.getInitialSharedContent();
  if (initialSharedData !== null) {
    NavigationService.dispatch(navigateToSharing(initialSharedData));
  }
};

export class ShareReceivedListener {
  unsubs: Array<() => void> = [];

  /** Private. */
  listen(name: string, handler: (...empty) => void | Promise<void>) {
    if (Platform.OS === 'android') {
      const subscription = DeviceEventEmitter.addListener(name, handler);
      this.unsubs.push(() => subscription.remove());
    }
  }

  /** Private. */
  unlistenAll() {
    while (this.unsubs.length > 0) {
      this.unsubs.pop()();
    }
  }

  handleShareReceived = (data: SharedData) => {
    NavigationService.dispatch(navigateToSharing(data));
  };

  /** Start listening.  Don't call twice without intervening `stop`. */
  start() {
    if (Platform.OS === 'android') {
      this.listen('shareReceived', this.handleShareReceived);
    }
  }

  /** Stop listening. */
  stop() {
    this.unlistenAll();
  }
}
