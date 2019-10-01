/* @flow strict-local */
import type { Auth, Dispatch, GetState } from './types';
import * as api from './api';
import { getAuth } from './account/accountsSelectors';

export function withApi(f: (typeof api, Auth) => Promise<mixed>) {
  return (dispatch: Dispatch, getState: GetState) => f(api, getAuth(getState()));
}
