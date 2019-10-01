/* @flow strict-local */
import { withApi } from '../apiReduxThunk';

export const updateUserAwayStatus = (away: boolean) =>
  withApi((api, auth) => api.updateUserStatus(auth, { away }));

export const updateUserStatusText = (statusText: string) =>
  withApi((api, auth) => api.updateUserStatus(auth, { status_text: statusText }));
