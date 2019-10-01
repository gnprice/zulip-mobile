/* @flow strict-local */
import differenceInSeconds from 'date-fns/difference_in_seconds';

import type { Dispatch, GetState, Narrow } from '../types';
import * as api from '../api';
import { PRESENCE_RESPONSE } from '../actionConstants';
import { tryGetAuth } from '../selectors';
import { isPrivateOrGroupNarrow } from '../utils/narrow';
import { withApi } from '../apiReduxThunk';

let lastReportPresence = new Date();
let lastTypingStart = new Date();

export const reportPresence = (hasFocus: boolean = true, newUserInput: boolean = false) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const auth = tryGetAuth(getState());
  if (!auth) {
    return; // not logged in
  }

  if (differenceInSeconds(new Date(), lastReportPresence) < 60) {
    return;
  }

  lastReportPresence = new Date();

  const response = await api.reportPresence(auth, hasFocus, newUserInput);
  dispatch({
    type: PRESENCE_RESPONSE,
    presence: response.presences,
    serverTimestamp: response.server_timestamp,
  });
};

export const sendTypingEvent = (narrow: Narrow) =>
  // eslint-disable-next-line no-shadow
  withApi(async (api, auth) => {
    if (!isPrivateOrGroupNarrow(narrow)) {
      return;
    }

    if (differenceInSeconds(new Date(), lastTypingStart) > 15) {
      api.typing(auth, narrow[0].operand, 'start');
      lastTypingStart = new Date();
    }
  });
