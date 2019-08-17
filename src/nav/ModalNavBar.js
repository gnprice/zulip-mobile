/* @flow strict-local */

import React, { PureComponent } from 'react';
import { View } from 'react-native';

import type { Context, LocalizableText } from '../types';
import styles from '../styles';
import Label from '../common/Label';

type Props = {|
  title: LocalizableText,
|};

export default class ModalNavBar extends PureComponent<Props> {
  context: Context;

  static contextTypes = {
    styles: () => null,
  };

  render() {
    const { styles: contextStyles } = this.context;
    const { title } = this.props;
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
