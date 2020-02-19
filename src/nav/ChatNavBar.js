/* @flow strict-local */

import React, { PureComponent } from 'react';
import { View } from 'react-native';

import type { Dispatch, Narrow } from '../types';
import { connect } from '../react-redux';
import styles, { BRAND_COLOR } from '../styles';
import Title from '../title/Title';
import NavButton from './NavButton';
import { foregroundColorFromBackground } from '../utils/color';
import { navigateBack } from '../actions';
import { ExtraButton, InfoButton } from '../title-buttons/titleButtonFromNarrow';
import { getSubscriptionColorForNarrow } from '../subscriptions/subscriptionSelectors';

type SelectorProps = {|
  subscriptionColor: string | null,
|};

type Props = $ReadOnly<{|
  narrow: Narrow,

  dispatch: Dispatch,
  ...SelectorProps,
|}>;

class ChatNavBar extends PureComponent<Props> {
  render() {
    const { dispatch, subscriptionColor, narrow } = this.props;
    const backgroundColor = subscriptionColor ?? 'transparent';
    const color =
      subscriptionColor !== null ? foregroundColorFromBackground(subscriptionColor) : BRAND_COLOR;

    return (
      <View style={[styles.navBar, { backgroundColor }]}>
        <NavButton
          name="arrow-left"
          color={color}
          onPress={() => {
            dispatch(navigateBack());
          }}
        />
        <Title color={color} narrow={narrow} />
        <ExtraButton color={color} narrow={narrow} />
        <InfoButton color={color} narrow={narrow} />
      </View>
    );
  }
}

export default connect<SelectorProps, _, _>((state, props) => ({
  subscriptionColor: getSubscriptionColorForNarrow(state, props.narrow),
}))(ChatNavBar);
