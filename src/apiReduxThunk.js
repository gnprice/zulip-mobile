/* @flow strict-local */
import type { Auth, Dispatch, GetState, GlobalState } from './types';
import * as api from './api';
import { getAuth } from './account/accountsSelectors';

export function withApi(
  f: (api: typeof api, auth: Auth, dispatch: Dispatch, state: GlobalState) => Promise<mixed>,
) {
  return (dispatch: Dispatch, getState: GetState) =>
    f(api, getAuth(getState()), dispatch, getState());
}
