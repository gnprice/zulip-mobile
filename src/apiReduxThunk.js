/* @flow strict-local */
import type { Auth, Dispatch, GetState, GlobalState } from './types';
import * as api from './api';
import { getAuth } from './account/accountsSelectors';
import { objectFromEntries } from './jsBackport';

// prettier-ignore
type ApplyAuth =
 & <R>((Auth, ...Array<empty>) => R) => () => R
 & <T1, R>((Auth, T1, ...Array<empty>) => R) => (T1) => R
 ;

type AuthedApi = $ObjMap<typeof api, ApplyAuth>;

const x = ((null: $FlowFixMe): AuthedApi);

const u = x.getUsers();
const r2 = x.deleteStream(); // TODO no error -- should require number arg

/*
const wrapApi = (auth: Auth): $ObjMap<typeof api, ApplyAuth> =>
  objectFromEntries(Object.keys(api).map(name => [name, (...args) => api[name](auth, ...args)]));
*/

export function withApi(
  f: (api: typeof api, auth: Auth, dispatch: Dispatch, state: GlobalState) => Promise<mixed>,
) {
  return (dispatch: Dispatch, getState: GetState) =>
    f(api, getAuth(getState()), dispatch, getState());
}
