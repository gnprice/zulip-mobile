/* @flow strict-local */
import type { GetState, Dispatch } from '../types';
import { getAuth } from '../selectors';
import type { SubscriptionProperty } from '../api/subscriptions/setSubscriptionProperty';
import * as api from '../api';

export const setSubscriptionProperty = (
  streamId: number,
  property: SubscriptionProperty,
  value: boolean,
): ((dispatch: Dispatch, getState: GetState) => Promise<void>) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  await api.setSubscriptionProperty(getAuth(getState()), streamId, property, value);
};
