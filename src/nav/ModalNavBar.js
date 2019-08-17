/* @flow strict-local */

import React, { PureComponent } from 'react';
import { View } from 'react-native';

import type { Dispatch, Context, LocalizableText } from '../types';
import { connect } from '../react-redux';
import styles, { NAVBAR_SIZE } from '../styles';
import Label from '../common/Label';

type Props = {|
  dispatch: Dispatch,
  title: LocalizableText,
|};

class ModalNavBar extends PureComponent<Props> {
  context: Context;

  static contextTypes = {
    styles: () => null,
  };

  render() {
    const { styles: contextStyles } = this.context;
    const { dispatch, title } = this.props;
    const textStyle = [
      styles.navTitle,
	{ marginLeft: 16 },
    ];

    return (
      <View style={[contextStyles.navBar]}>
        <View style={styles.flexedLeftAlign}>
          <Label style={textStyle} text={title} numberOfLines={1} ellipsizeMode="tail" />
        </View>
      </View>
    );
  }
}

export default connect()(ModalNavBar);
