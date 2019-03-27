/* @flow */
import React, { PureComponent } from 'react';
import type { ComponentType, ElementConfig } from 'react';
import { StyleSheet, View } from 'react-native';
import { connect as connect1 } from 'react-redux';

import type { Dispatch, GlobalState, User } from '../types';
import { getOwnUser } from '../selectors';
import AccountDetails from './AccountDetails';

const componentStyles = StyleSheet.create({
  accountButtons: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginHorizontal: 8,
  },
});

type Props = {|
  ownUser: User,
|};

class OwnAccountCard extends PureComponent<Props> {
  render() {
    const { ownUser } = this.props;

    return (
      <View>
        <AccountDetails user={ownUser} />
        <View style={componentStyles.accountButtons} />
      </View>
    );
  }
}

/*
type MapStateToProps<S: {}, SP: {}, RSP: {}> = (state: S, props: SP) => $ReadOnly<RSP>;
type OmitDispatch<Component> = $Diff<Component, { dispatch?: mixed }>;

// From the first one in the libdef (the relevant one for this callsite),
// but (a) replacing all pseudotypes `any` and `Object`; (b) giving a name
// to the `*` generic parameter.
function connect2<
  P: {},
  Com: ComponentType<P>,
  S: {},
  SP: {},
  RSP: {},
  CP: $Diff<OmitDispatch<ElementConfig<Com>>, RSP>,
  ST: { [_: $Keys<Com>]: mixed },
>(
  mapStateToProps: MapStateToProps<S, SP, RSP>,
): (component: Com) => ComponentType<CP & SP> & $Shape<ST> {
  return connect1(mapStateToProps);
}

// still passes
function connect3<RSP: {}>(
  mapStateToProps: GlobalState => $ReadOnly<RSP>,
): (
  component: Class<OwnAccountCard>,
) => ComponentType<$Diff<ElementConfig<Class<OwnAccountCard>>, RSP>> {
  return connect1(mapStateToProps);
}

// fails, yay!
// prettier-ignore
function connect4<RSP: {}>( // ownUser: User[] }>(
  mapStateToProps: GlobalState => $ReadOnly<RSP>,
): (
  component: Class<OwnAccountCard>,
) => ComponentType<$Diff<ElementConfig<Class<OwnAccountCard>>, RSP>> {
  return connect1(mapStateToProps);
}

// fails, yay!
function connect5<P: $Shape<Props>>(
  mapStateToProps: GlobalState => P,
): (
  component: Class<OwnAccountCard>,
) => ComponentType<$Diff<ElementConfig<Class<OwnAccountCard>>, P>> {
  return connect1(mapStateToProps);
}
*/

// Still fails, yay -- and generic again!
// Still to do:
//  * all the other overloads
//  * permit null/undefined mDP on this same overload
//  * handle statics
//  * ??
function connect6<S: {}, Com: ComponentType<*>, P: $Shape<ElementConfig<Com>>>(
  mapStateToProps: S => $ReadOnly<P>,
): (component: Com) => ComponentType<$Diff<ElementConfig<Com>, P>> {
  return connect1(mapStateToProps);
}

// [x] allow null/undef mDP
function connect<S: {}, Com: ComponentType<*>, P: $Shape<ElementConfig<Com>>>(
  mapStateToProps: S => $ReadOnly<P>,
  mapDispatchToProps?: null,
): (component: Com) => ComponentType<$Diff<ElementConfig<Com>, P>> {
  return connect1(mapStateToProps);
}

export default connect((state: GlobalState) => ({
  ownUser: getOwnUser(state),
}))(OwnAccountCard);
