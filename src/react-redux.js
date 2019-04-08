/* @flow strict-local */
import type { ComponentType, ElementConfig } from 'react';
import { connect as connectInner } from 'react-redux';

import type { GlobalState, Dispatch } from './types';

type IsSupertype<+S, +T: S> = S;

// Oddly, Flow accepts this declaration with <-U, -L> but also with <+U, +L>.
export type BoundedDiff<-U, -L> = $Diff<
  IsSupertype<U, $ReadOnly<{| ...U, ...L |}>>,
  $ObjMap<L, () => mixed>,
>;

export type OwnProps<-C, -SP> = $Diff<BoundedDiff<ElementConfig<C>, SP>, {| dispatch: Dispatch |}>;

export const connect: <SP, P, C: ComponentType<P>>
  (((GlobalState, OwnProps<C, SP>) => SP) | void) => C => ComponentType<OwnProps<C, SP>> =
    (msp) => connectInner(msp);
