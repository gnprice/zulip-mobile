/* @flow strict-local */
import { AsyncStorage, NativeModules } from 'react-native';
import { logErrorRemotely } from '../utils/logging';

export default class ZulipAsyncStorage {
  static async getItem(key: string, callback: ?(error: ?Error, result: ?string) => void) {
    let result = await AsyncStorage.getItem(key);
    if (callback) {
      callback(undefined, result);
    }
    return result;
  }

  static async setItem(key: string, value: string, callback: ?(error: ?Error) => void) {
    return AsyncStorage.setItem(key, value, callback);
  }

  static getAllKeys = AsyncStorage.getAllKeys;

  static clear = AsyncStorage.clear;
}
