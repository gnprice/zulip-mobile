/* @flow strict-local */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';

import { BRAND_COLOR } from '../styles';
import { RawLabel, Touchable } from '../common';
import { IconDone, IconTrash } from '../common/Icons';

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'space-between',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'hsla(177, 70%, 47%, 0.1)',
    borderRadius: 4,
      height: 72,
      margin: 8,
  },
  details: {
    flex: 1,
    marginLeft: 16,
  },
  text: {
    color: BRAND_COLOR,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  icon: {
    padding: 12,
    margin: 12,
  },
});

type Props = {|
  index: number,
  realm: string,
  onSelect: (index: number) => void,
  onRemove: (index: number) => void,
|};

export default class AccountItem extends PureComponent<Props> {
  handleSelect = () => this.props.onSelect(this.props.index);

  handleRemove = () => this.props.onRemove(this.props.index);

  render() {
    const { realm } = this.props;

    return (
      <Touchable style={styles.wrapper} onPress={this.handleSelect}>
        <View style={[styles.accountItem]}>
          <View style={styles.details}>
            <RawLabel style={styles.text} text={realm} numberOfLines={1} />
          </View>
          <IconTrash style={styles.icon} size={24} color="crimson" onPress={this.handleRemove} />
        </View>
      </Touchable>
    );
  }
}
