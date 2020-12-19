/* @flow strict-local */
import * as typing_status from '@zulip/shared/js/typing_status';

import type { Auth, Dispatch, GetState, GlobalState, Narrow, UserId, UserOrBot } from '../types';
import * as api from '../api';
import { PRESENCE_RESPONSE } from '../actionConstants';
import { getAuth, tryGetAuth, getServerVersion } from '../selectors';
import { isPmNarrow, userIdsOfPmNarrow } from '../utils/narrow';
import { getAllUsersByEmail, getUserForId } from './userSelectors';
import { ZulipVersion } from '../utils/zulipVersion';
import { objectFromEntries } from '../jsBackport';

// Convert keys from email to ID.
// If not found, just drop the entry.
function transformPresenceResponse<T>(
  apiResponse: { [email: string]: T },
  allUsersByEmail: Map<string, UserOrBot>,
): { [number]: T } {
  return objectFromEntries(
    Object.keys(apiResponse)
      .map(email => {
        const user = allUsersByEmail.get(email);
        if (!user) {
          return null;
        }
        return [user.user_id, apiResponse[email]];
      })
      .filter(Boolean),
  );
}

export const reportPresence = (isActive: boolean = true, newUserInput: boolean = false) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const auth = tryGetAuth(getState());
  if (!auth) {
    return; // not logged in
  }

  const response = await api.reportPresence(auth, isActive, newUserInput);
  const allUsersByEmail = getAllUsersByEmail(getState());
  dispatch({
    type: PRESENCE_RESPONSE,
    presence: transformPresenceResponse(response.presences, allUsersByEmail),
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
  // TODO(server-2.0): Cut this condition, and stop using emails here.
  const useEmailArrays = !!serverVersion && !serverVersion.isAtLeast('2.0.0-rc1');

  const getRecipients = user_ids_array => {
    if (useEmailArrays) {
      return JSON.stringify(user_ids_array.map(userId => getUserForId(state, userId).email));
    }
    return JSON.stringify(user_ids_array);
  };

  return {
    get_current_time: () => new Date().getTime(),

    notify_server_start: (user_ids_array: $ReadOnlyArray<UserId>) => {
      api.typing(auth, getRecipients(user_ids_array), 'start');
    },

    notify_server_stop: (user_ids_array: $ReadOnlyArray<UserId>) => {
      api.typing(auth, getRecipients(user_ids_array), 'stop');
    },
  };
};

export const sendTypingStart = (narrow: Narrow) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  if (!isPmNarrow(narrow)) {
    return;
  }

  const recipientIds = userIdsOfPmNarrow(narrow);
  typing_status.update(typingWorker(getState()), recipientIds);
};

// TODO call this on more than send: blur, navigate away,
//   delete all contents, etc.
export const sendTypingStop = (narrow: Narrow) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  if (!isPmNarrow(narrow)) {
    return;
  }

  typing_status.update(typingWorker(getState()), null);
};
