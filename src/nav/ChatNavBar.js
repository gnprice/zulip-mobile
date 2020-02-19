/* @flow strict-local */

import React, { PureComponent } from 'react';
import { View } from 'react-native';

import type { Dispatch, Narrow, Subscription } from '../types';
import { connect } from '../react-redux';
import styles, { BRAND_COLOR } from '../styles';
import Title from '../title/Title';
import NavButton from './NavButton';
import { foregroundColorFromBackground } from '../utils/color';
import { navigateBack } from '../actions';
import { ExtraButton, InfoButton } from '../title-buttons/titleButtonFromNarrow';
import { getSubscriptionsByName } from '../subscriptions/subscriptionSelectors';
import { tryStreamNameOfNarrow } from '../utils/narrow';

type SelectorProps = {|
  subscriptionsByName: Map<string, Subscription>,
|};

type Props = $ReadOnly<{|
  narrow: Narrow,

  dispatch: Dispatch,
  ...SelectorProps,
|}>;

class ChatNavBar extends PureComponent<Props> {
  render() {
    const { dispatch, subscriptionsByName, narrow } = this.props;
    const streamName = tryStreamNameOfNarrow(narrow);
    const backgroundColor =
      streamName === null ? 'transparent' : subscriptionsByName.get(streamName)?.color ?? 'gray';
    const color =
      backgroundColor === 'transparent'
        ? BRAND_COLOR
        : foregroundColorFromBackground(backgroundColor);

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
  subscriptionsByName: getSubscriptionsByName(state),
}))(ChatNavBar);
