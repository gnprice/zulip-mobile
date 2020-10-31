/* @flow strict-local */
import * as typing_status from '@zulip/shared/js/typing_status';

import type { Auth, Dispatch, GetState, GlobalState, NarrowBridge } from '../types';
import * as api from '../api';
import { PRESENCE_RESPONSE } from '../actionConstants';
import { getAuth, tryGetAuth, getServerVersion } from '../selectors';
import { isPrivateOrGroupNarrow, caseNarrowPartial, asApiStringNarrow } from '../utils/narrow';
import { getAllUsersByEmail, getUserForId } from './userSelectors';
import { ZulipVersion } from '../utils/zulipVersion';

export const reportPresence = (isActive: boolean = true, newUserInput: boolean = false) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const auth = tryGetAuth(getState());
  if (!auth) {
    return; // not logged in
  }

  const response = await api.reportPresence(auth, isActive, newUserInput);
  dispatch({
    type: PRESENCE_RESPONSE,
    presence: response.presences,
    serverTimestamp: response.server_timestamp,
  });
};

const typingWorker = (state: GlobalState) => {
  const auth: Auth = getAuth(state);
  const serverVersion: ZulipVersion | null = getServerVersion(state);

  // User ID arrays are only supported in server versions >= 2.0.0-rc1
  // (zulip/zulip@2f634f8c0). For versions before this, email arrays
  // are used. If current server version is undetermined, user ID
  // arrays are optimistically used.
  const useEmailArrays = !!serverVersion && !serverVersion.isAtLeast('2.0.0-rc1');

  const getRecipients = user_ids_array => {
    if (useEmailArrays) {
      return JSON.stringify(user_ids_array.map(userId => getUserForId(state, userId).email));
    }
    return JSON.stringify(user_ids_array);
  };

  return {
    get_current_time: () => new Date().getTime(),

    notify_server_start: (user_ids_array: number[]) => {
      api.typing(auth, getRecipients(user_ids_array), 'start');
    },

    notify_server_stop: (user_ids_array: number[]) => {
      api.typing(auth, getRecipients(user_ids_array), 'stop');
    },
  };
};

export const sendTypingStart = (narrowBridge: NarrowBridge) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const narrow = asApiStringNarrow(narrowBridge);
  if (!isPrivateOrGroupNarrow(narrow)) {
    return;
  }

  const usersByEmail = getAllUsersByEmail(getState());
  const recipientIds = caseNarrowPartial(narrow, {
    pm: email => [email],
    groupPm: emails => emails,
  }).map(email => {
    const user = usersByEmail.get(email);
    if (!user) {
      throw new Error('unknown user');
    }
    return user.user_id;
  });
  typing_status.update(typingWorker(getState()), recipientIds);
};

// TODO call this on more than send: blur, navigate away,
//   delete all contents, etc.
export const sendTypingStop = (narrowBridge: NarrowBridge) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const narrow = asApiStringNarrow(narrowBridge);

  if (!isPrivateOrGroupNarrow(narrow)) {
    return;
  }

  typing_status.update(typingWorker(getState()), null);
};
