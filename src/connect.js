/* @flow strict-local */
import type { ComponentType, ElementConfig } from 'react';
import { connect as connect1 } from 'react-redux';

/*
Corresponds to the first overload in the react-redux libdef, i.e.

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

[x] error on type mismatch in an mSP-returned prop vs. component props type
[x] allow null/undef mDP
[ ] handle statics
[ ] handle props from caller bypassing mSP
[ ] ???
[ ] the other overloads
*/
export default function connect<S: {}, Com: ComponentType<*>, P: $Shape<ElementConfig<Com>>>(
  mapStateToProps: S => $ReadOnly<P>,
  mapDispatchToProps?: null,
): (component: Com) => ComponentType<$Diff<ElementConfig<Com>, P>> {
  return connect1(mapStateToProps);
}
