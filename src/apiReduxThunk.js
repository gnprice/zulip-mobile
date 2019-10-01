/* @flow strict-local */
import type { Auth, Dispatch, GetState, GlobalState } from './types';
import * as api from './api';
import { getAuth } from './account/accountsSelectors';
import { objectFromEntries } from './jsBackport';

type Fn0<R> = (...mixed[]) => R;
type Fn1<A, R> = (A, ...mixed[]) => R;
type Fn2<A, B, R> = (A, B, ...mixed[]) => R;

// eslint-disable no-redeclare
declare function afterAuth<R>(f: Fn1<Auth, R>): Fn0<R>;
declare function afterAuth<A, R>(f: Fn2<Auth, A, R>): Fn1<A, R>;
declare function afterAuth<A, B, R>(f: (Auth, A, B) => R): (A, B) => R;
declare function afterAuth<A, B, C, R>(f: (Auth, A, B, C) => R): (A, B, C) => R;
declare function afterAuth<A, B, C, D, R>(f: (Auth, A, B, C, D) => R): (A, B, C, D) => R;
declare function afterAuth<A, B, C, D, E, R>(f: (Auth, A, B, C, D, E) => R): (A, B, C, D, E) => R;
declare function afterAuth<A, B, C, D, E, F, R>(
  f: (Auth, A, B, C, D, E, F) => R,
): (A, B, C, D, E, F) => R;
declare function afterAuth<A, B, C, D, E, F, G, R>(
  f: (Auth, A, B, C, D, E, F, G) => R,
): (A, B, C, D, E, F, G) => R;
declare function afterAuth<A, B, C, D, E, F, G, H, R>(
  f: (Auth, A, B, C, D, E, F, G, H) => R,
): (A, B, C, D, E, F, G, H) => R;

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

const r4 = x.muteTopic('x', 'y');

// This rightly causes an error, though the message is unhelpful
// const r5 = x.getServerSettings('https://chat.example.com');

// This probably *should* cause an error, but doesn't
const r6 = x.checkCompatibility();

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
