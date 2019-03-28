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

  declare export function createProvider(
    storeKey?: string,
    subKey?: string
  ): Provider<*, *, *>;

  /*

  S = State
  A = Action
  OP = OwnProps
  SP = StateProps
  DP = DispatchProps
  MP = Merge props
  MDP = Map dispatch to props object
  RSP = Returned state props
  RDP = Returned dispatch props
  RMP = Returned merge props
  CP = Props for returned component
  Com = React Component
  ST = Static properties of Com
  EFO = Extra factory options (used only in connectAdvanced)
  */

  declare type MapStateToProps<S: Object, SP: Object, RSP: Object> = (state: S, props: SP) => RSP;

  declare type MapDispatchToProps<A, OP: Object, RDP: Object> = (dispatch: Dispatch<A>, ownProps: OP) => RDP;

  declare type MergeProps<SP: Object, DP: Object, MP: Object, RMP: Object> = (
    stateProps: SP,
    dispatchProps: DP,
    ownProps: MP
  ) => RMP;

  declare type ConnectOptions<S: Object, OP: Object, RSP: Object, RMP: Object> = {|
    pure?: boolean,
    withRef?: boolean,
    areStatesEqual?: (next: S, prev: S) => boolean,
    areOwnPropsEqual?: (next: OP, prev: OP) => boolean,
    areStatePropsEqual?: (next: RSP, prev: RSP) => boolean,
    areMergedPropsEqual?: (next: RMP, prev: RMP) => boolean,
    storeKey?: string
  |};

  declare type OmitDispatch<Component> = $Diff<Component, {dispatch?: Dispatch<*>}>;

  declare export function connect<
    Com: ComponentType<*>,
    S: Object,
    SP: Object,
    RSP: Object,
    CP: $Diff<OmitDispatch<ElementConfig<Com>>, RSP>,
    ST: {[_: $Keys<Com>]: any}
    >(
    mapStateToProps: MapStateToProps<S, SP, RSP>,
    mapDispatchToProps?: null
  ): (component: Com) => ComponentType<CP & SP> & $Shape<ST>;

  declare export function connect<
    Com: ComponentType<*>,
    ST: {[_: $Keys<Com>]: any}
    >(
    mapStateToProps?: null,
    mapDispatchToProps?: null
  ): (component: Com) => ComponentType<OmitDispatch<ElementConfig<Com>>> & $Shape<ST>;

  declare export default {
    Provider: typeof Provider,
    createProvider: typeof createProvider,
    connect: typeof connect,
  };
}
