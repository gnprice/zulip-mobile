/* @flow strict-local */
import type { ComponentType, ElementConfig } from 'react';
import { connect as connectInner } from 'react-redux';

import type { GlobalState, Dispatch } from './types';


// CAUTION: These only function when actually forced to be instantiated.
// E.g. a hoped-for
//   type With<S, P> = S;
// utters not a peep at
//   const x: With<null, IsEqual<string, number>> = null;
// Still, probably handy if used cleverly.
type IsSupertype<+S, +T: S> = S;
type IsSupertype2<+S, +T: S> = T; // a helper
type IsSubtype<+S, +T> = IsSupertype2<T, S>; // i.e. S, if true
type IsEqual<+S, +T: S> = IsSupertype2<T, S>; // i.e. S (== T), if true

/*
 * Has type T, but only if T <= T1 -- and T, T1 both instantiable.
 *
 * E.g. Chain<S, IsEqual<S, T>> is S, but additionally requires S == T.
 */
type Chain<T1, T: T1> = T;
type And1<T1, T: T1> = T;
type And2<T2, T1: T2, T: T1> = T;

type IsElementwiseSubtype<+S, +T> =
  $ObjMapi<S,
    <K, V>(K, V) => IsSubtype<V, $ElementType<T, K>>
  >;

// Oddly, Flow accepts this declaration with <-U, -L> but also with <+U, +L>.
type BoundedDiff<-U, -L> = $Diff<
  IsSupertype<U, $ReadOnly<{| ...U, ...L |}>>,
  $ObjMap<L, () => mixed>,
>;

type OwnProps<-C, -SP> = $Diff<BoundedDiff<ElementConfig<C>, SP>, {| dispatch: Dispatch |}>;

export function connect<
  SP,
  P,
  C: ComponentType<P>,
  //</P>SP: IsElementwiseSubtype<$Exact<SP1>, ElementConfig<C>>,
  >(mapStateToProps: GlobalState => SP): C => ComponentType<OwnProps<C, SP>> {
  return connectInner(mapStateToProps);
}
