/* @flow strict-local */
import type { Dispatch, GetState } from '../types';
import * as api from '../api';
import { getAuth } from '../selectors';

export const updateUserAwayStatus = (away: boolean): ((dispatch: Dispatch, getState: GetState) => Promise<void>) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const auth = getAuth(getState());
  api.updateUserStatus(auth, { away });
};

export const updateUserStatusText = (statusText: string): ((dispatch: Dispatch, getState: GetState) => Promise<void>) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const auth = getAuth(getState());
  api.updateUserStatus(auth, { status_text: statusText });
};
