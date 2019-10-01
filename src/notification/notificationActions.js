/* @flow strict-local */
import { Platform } from 'react-native';
import type { Account, Dispatch, GetState, Identity, Action } from '../types';
import { getNotificationToken, getNarrowFromNotificationData } from '.';
import type { Notification } from '.';
import { getActiveAccount } from '../selectors';
import { getSession, getAccounts } from '../directSelectors';
import { GOT_PUSH_TOKEN, ACK_PUSH_TOKEN, UNACK_PUSH_TOKEN } from '../actionConstants';
import { identityOfAccount, authOfAccount, identityOfAuth } from '../account/accountMisc';
import { getUsersById } from '../users/userSelectors';
import { doNarrow } from '../message/messagesActions';
import * as logging from '../utils/logging';
import { withApi } from '../apiReduxThunk';

export const gotPushToken = (pushToken: string): Action => ({
  type: GOT_PUSH_TOKEN,
  pushToken,
});

export const unackPushToken = (identity: Identity): Action => ({
  type: UNACK_PUSH_TOKEN,
  identity,
});

const ackPushToken = (pushToken: string, identity: Identity): Action => ({
  type: ACK_PUSH_TOKEN,
  identity,
  pushToken,
});

export const narrowToNotification = (data: ?Notification) => (
  dispatch: Dispatch,
  getState: GetState,
) => {
  if (!data) {
    return;
  }
  const usersById = getUsersById(getState());
  const narrow = getNarrowFromNotificationData(data, usersById);
  if (narrow) {
    dispatch(doNarrow(narrow));
  }
};

/** Tell the given server about this device token, if it doesn't already know. */
const sendPushToken = async (api, dispatch, account: Account | void, pushToken: string) => {
  if (!account || account.apiKey === '') {
    // We've logged out of the account and/or forgotten it.  Shrug.
    return;
  }
  if (account.ackedPushToken === pushToken) {
    // The server already knows this device token.
    return;
  }
  const auth = authOfAccount(account);
  await api.savePushToken(auth, Platform.OS, pushToken);
  dispatch(ackPushToken(pushToken, identityOfAccount(account)));
};

/** Tell all logged-in accounts' servers about our device token, as needed. */
export const sendAllPushToken = () =>
  withApi(async (api, auth, dispatch, state) => {
    const { pushToken } = getSession(state);
    if (pushToken === null) {
      return;
    }
    const accounts = getAccounts(state);
    await Promise.all(accounts.map(account => sendPushToken(api, dispatch, account, pushToken)));
  });

/** Tell the active account's server about our device token, if needed. */
export const initNotifications = () =>
  withApi(async (api, auth, dispatch, state) => {
    const { pushToken } = getSession(state);
    if (pushToken === null) {
      // We don't have the token yet.  When we learn it, the listener will
      // update this and all other logged-in servers.  Try to learn it.
      //
      // On Android this shouldn't happen -- our Android-native code requests
      // the token early in startup and fires the event that tells it to our
      // JS code -- but it's harmless to try again.
      //
      // On iOS this is normal because getting the token may involve showing
      // the user a permissions modal, so we defer that until this point.
      getNotificationToken();
      return;
    }
    const account = getActiveAccount(state);
    await sendPushToken(api, dispatch, account, pushToken);
  });

export const tryStopNotifications = () =>
  withApi(async (api, auth, dispatch, state) => {
    const { ackedPushToken: token } = getActiveAccount(state);
    if (token !== null) {
      dispatch(unackPushToken(identityOfAuth(auth)));
      try {
        await api.forgetPushToken(auth, Platform.OS, token);
      } catch (e) {
        logging.warn(e);
      }
    }
  });
