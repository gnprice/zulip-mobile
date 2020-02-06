/* @flow strict-local */

import React, { PureComponent } from 'react';
import { View } from 'react-native';

import type { Dispatch } from '../types';
import { createStyleSheet } from '../styles';
import { connect } from '../react-redux';
import { getUnreadCountForNarrow } from '../selectors';
import { Label, RawLabel } from '../common';
import MarkUnreadButton from './MarkUnreadButton';
import AnimatedScaleComponent from '../animation/AnimatedScaleComponent';
import { DualNarrow } from '../utils/narrow';

const styles = createStyleSheet({
  unreadContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'hsl(232, 89%, 78%)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  unreadTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadNumber: {
    fontSize: 14,
    color: 'white',
    paddingRight: 4,
  },
  unreadText: {
    fontSize: 14,
    color: 'white',
  },
});

type SelectorProps = {|
  unreadCount: number,
|};

type Props = $ReadOnly<{|
  narrow: DualNarrow<>,

  dispatch: Dispatch,
  ...SelectorProps,
|}>;

class UnreadNotice extends PureComponent<Props> {
  render() {
    const { narrow, unreadCount } = this.props;

    return (
      <AnimatedScaleComponent visible={unreadCount > 0} style={styles.unreadContainer}>
        <View style={styles.unreadTextWrapper}>
          <RawLabel style={styles.unreadNumber} text={unreadCount.toString()} />
          <Label
            style={styles.unreadText}
            text={unreadCount === 1 ? 'unread message' : 'unread messages'}
          />
        </View>
        <MarkUnreadButton narrow={narrow.clean} />
      </AnimatedScaleComponent>
    );
  }
}

export default connect<SelectorProps, _, _>((state, props) => ({
  unreadCount: getUnreadCountForNarrow(state, props.narrow.clean),
}))(UnreadNotice);
