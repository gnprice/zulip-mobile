/* @flow strict-local */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';

import { RawLabel } from '../common';
import { IconTrash } from '../common/Icons';

const styles = StyleSheet.create({
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'hsla(177, 70%, 47%, 0.1)',
    borderRadius: 4,
      margin: 8,
      padding: 16,
  },
    details: {
	flex: 1,
  },
  text: {
    fontWeight: 'bold',
  },
  icon: {
    padding: 12,
  },
});

type Props = {|
  index: number,
  realm: string,
  onRemove: (index: number) => void,
|};

export default class AccountItem extends PureComponent<Props> {
  handleRemove = () => this.props.onRemove(this.props.index);

  render() {
    const { realm } = this.props;

    return (
      <View style={[styles.accountItem]}>
        <View style={styles.details}>
          <RawLabel style={styles.text} text={realm} numberOfLines={1} />
        </View>
        <IconTrash style={styles.icon} size={24} color="crimson" onPress={this.handleRemove} />
      </View>
    );
  }
}
