/* @flow strict-local */
import differenceInSeconds from 'date-fns/difference_in_seconds';
import * as typing_status from '@zulip/shared/js/typing_status';

import type { Dispatch, GetState } from '../types';
import * as api from '../api';
import { PRESENCE_RESPONSE } from '../actionConstants';
import { getAuth, tryGetAuth } from '../selectors';
import { PmNarrow, CleanNarrow } from '../utils/narrow';

let lastReportPresence = new Date(0);

export const reportPresence = (hasFocus: boolean = true, newUserInput: boolean = false) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const auth = tryGetAuth(getState());
  if (!auth) {
    return; // not logged in
  }

  const now = new Date();
  if (differenceInSeconds(now, lastReportPresence) < 60) {
    // TODO throttle properly; probably fold setInterval logic in here
    return;
  }
  lastReportPresence = now;

  const response = await api.reportPresence(auth, hasFocus, newUserInput);
  dispatch({
    type: PRESENCE_RESPONSE,
    presence: response.presences,
    serverTimestamp: response.server_timestamp,
  });
};

const typingWorker = auth => ({
  get_current_time: () => new Date().getTime(),

  notify_server_start: (user_ids_array: number[]) => {
    api.typing(auth, JSON.stringify(user_ids_array), 'start');
  },

  notify_server_stop: (user_ids_array: number[]) => {
    api.typing(auth, JSON.stringify(user_ids_array), 'stop');
  },
});

export const sendTypingStart = (narrow: CleanNarrow) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  if (!(narrow instanceof PmNarrow)) {
    return;
  }

  const auth = getAuth(getState());
  typing_status.update(typingWorker(auth), narrow.userIds);
};

// TODO call this on more than send: blur, navigate away,
//   delete all contents, etc.
export const sendTypingStop = (narrow: CleanNarrow) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  if (!(narrow instanceof PmNarrow)) {
    return;
  }

  const auth = getAuth(getState());
  typing_status.update(typingWorker(auth), null);
};
