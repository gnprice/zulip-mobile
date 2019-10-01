/* @flow strict-local */
import { withApi } from '../apiReduxThunk';

export const toggleStreamNotification = (streamId: number, value: boolean) =>
  withApi((api, auth) => api.toggleStreamNotifications(auth, streamId, value));
