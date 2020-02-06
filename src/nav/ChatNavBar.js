/* @flow strict-local */

import React, { PureComponent } from 'react';
import { View } from 'react-native';

import type { Dispatch, NarrowBridge } from '../types';
import { connect } from '../react-redux';
import styles, { BRAND_COLOR } from '../styles';
import Title from '../title/Title';
import NavButton from './NavButton';
import { DEFAULT_TITLE_BACKGROUND_COLOR, getTitleBackgroundColor } from '../title/titleSelectors';
import { foregroundColorFromBackground } from '../utils/color';
import { navigateBack } from '../actions';
import { ExtraButton, InfoButton } from '../title-buttons/titleButtonFromNarrow';
import { asApiStringNarrow } from '../utils/narrow';

type SelectorProps = {|
  backgroundColor: string,
|};

type Props = $ReadOnly<{|
  narrow: NarrowBridge,

  dispatch: Dispatch,
  ...SelectorProps,
|}>;

class ChatNavBar extends PureComponent<Props> {
  render() {
    const { dispatch, backgroundColor, narrow: narrowBridge } = this.props;
    const color =
      backgroundColor === DEFAULT_TITLE_BACKGROUND_COLOR
        ? BRAND_COLOR
        : foregroundColorFromBackground(backgroundColor);

    const narrow = asApiStringNarrow(narrowBridge);
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
  backgroundColor: getTitleBackgroundColor(props.narrow)(state),
}))(ChatNavBar);
