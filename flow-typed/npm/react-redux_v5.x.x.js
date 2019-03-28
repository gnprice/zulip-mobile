// flow-typed signature: b872fdc4da6b0c1021c55df6fab87e73
// flow-typed version: f8afc4cfdd/react-redux_v5.x.x/flow_>=v0.68.0 <=v0.84.x

declare module "react-redux" {
  import type { ComponentType, ElementConfig } from 'react';

  // These types are copied directly from the redux libdef. Importing them in
  // this libdef causes a loss in type coverage.
  declare type DispatchAPI<A> = (action: A) => A;
  declare type Dispatch<A: { type: $Subtype<string> }> = DispatchAPI<A>;
  declare type Reducer<S, A> = (state: S | void, action: A) => S;
  declare type Store<S, A, D = Dispatch<A>> = {
    dispatch: D;
    getState(): S;
    subscribe(listener: () => void): () => void;
    replaceReducer(nextReducer: Reducer<S, A>): void
  };

  declare export class Provider<S, A, D> extends React$Component<{
    store: Store<S, A, D>,
    children?: any
  }> {}

  /*
  S = State
  A = Action
  SP = StateProps
  RSP = Returned state props
  RMP = Returned merge props
  CP = Props for returned component
  Com = React Component
  ST = Static properties of Com
  */

  declare type MapStateToProps1<S: Object, SP: Object, RSP: Object> = (state: S, props: SP) => RSP;

  declare type OmitDispatch<Component> = $Diff<Component, {dispatch?: Dispatch<*>}>;

  /*
  declare export function connect<
    Com: ComponentType<*>,
    S: Object,
    SP: Object,
    RSP: Object,
    CP: $Diff<OmitDispatch<ElementConfig<Com>>, RSP>,
    ST: {[_: $Keys<Com>]: any}
    >(
    mapStateToProps: MapStateToProps1<S, SP, RSP>,
    mapDispatchToProps?: null
  ): (component: Com) => ComponentType<CP & SP> & $Shape<ST>;

  declare export function connect<
    Com: ComponentType<*>,
    ST: {[_: $Keys<Com>]: any}
    >(
    mapStateToProps?: null,
    mapDispatchToProps?: null
  ): (component: Com) => ComponentType<OmitDispatch<ElementConfig<Com>>> & $Shape<ST>;
*/

  declare type MapStateToProps<-S, -OP, +SP> = (
    state: S,
    ownProps: OP,
  ) => SP;

  declare class ConnectedComponent<OP, +WC> extends React$Component<OP> {
    static +WrappedComponent: WC;
    getWrappedInstance(): React$ElementRef<WC>;
  }
  // The connection of the Wrapped Component and the Connected Component
  // happens here in `MP: P`. It means that type wise MP belongs to P,
  // so to say MP >= P.
  declare type Connector<P, OP, MP: P> = <WC: React$ComponentType<P>>(
    WC,
  ) => Class<ConnectedComponent<OP, WC>> & WC;

  // No `mergeProps` argument

  // Got error like inexact OwnProps is incompatible with exact object type?
  // Just make the OP parameter for `connect()` an exact object.
  declare type MergeOP<OP, D> = {| ...$Exact<OP>, dispatch: D |};
  declare type MergeOPSP<OP, SP, D> = {| ...$Exact<OP>, ...SP, dispatch: D |};
  declare type MergeOPDP<OP, DP> = {| ...$Exact<OP>, ...DP |};
  declare type MergeOPSPDP<OP, SP, DP> = {| ...$Exact<OP>, ...SP, ...DP |};

  declare export function connect<-P, -OP, -SP, -DP, -S, -D>(
    mapStateToProps?: null | void,
    mapDispatchToProps?: null | void,
    mergeProps?: null | void,
  ): Connector<P, OP, MergeOP<OP, D>>;

  declare export function connect<-P, -OP, -SP, -DP, -S, -D>(
    // If you get error here try adding return type to your mapStateToProps function
    mapStateToProps: MapStateToProps<S, OP, SP>,
    mapDispatchToProps?: null | void,
    mergeProps?: null | void,
  ): Connector<P, OP, MergeOPSP<OP, SP, D>>;

  declare export default {
    Provider: typeof Provider,
    connect: typeof connect,
  };
}
