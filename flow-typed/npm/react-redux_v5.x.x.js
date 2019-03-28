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

  declare type MapStateToProps<S: Object, SP: Object, RSP: Object> = (state: S, props: SP) => RSP;

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
    connect: typeof connect,
  };
}
