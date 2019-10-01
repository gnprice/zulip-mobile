/* @flow strict-local */
import type { Auth, Dispatch, GetState, GlobalState } from './types';
import * as api from './api';
import { getAuth } from './account/accountsSelectors';
import { objectFromEntries } from './jsBackport';

type Fn0<R> = (...mixed[]) => R;
type Fn1<A, R> = (A, ...mixed[]) => R;
type Fn2<A, B, R> = (A, B, ...mixed[]) => R;

// eslint-disable no-redeclare
declare function applyAuth<R>(auth: Auth, f: Fn1<Auth, R>): Fn0<R>;
declare function applyAuth<A, R>(auth: Auth, f: Fn2<Auth, A, R>): Fn1<A, R>;

function applyAuth(auth, f) {
  return (...args) => f(auth, args);
}

declare function afterAuth<R>(f: Fn1<Auth, R>): Fn0<R>;
declare function afterAuth<A, R>(f: Fn2<Auth, A, R>): Fn1<A, R>;

// prettier-ignore
type ApplyAuth = typeof afterAuth;

type AuthedApi = $ObjMap<typeof api, ApplyAuth>;

const x = ((null: $FlowFixMe): AuthedApi);

// TODO extra args don't get rejected
const r1 = x.getUsers(5);
const r2 = x.deleteStream(3, 4);
// but yay, arg types do get checked!
// const r3 = x.deleteStream({ a: 1 });
// and result types get appropriately inferred
r1.then(v => v.members[0].user_id);

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
