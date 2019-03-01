/* @flow strict-local */
import { connect } from 'react-redux';

import React, { PureComponent } from 'react';

import type { Debug, Dispatch, GlobalState } from '../types';
import { getSession } from '../selectors';
import { OptionRow, Screen } from '../common';
import { debugFlagToggle } from '../actions';

/* eslint-disable no-console */

type Props = {|
  debug: Debug,
  dispatch: Dispatch,
|};

class DebugScreen extends PureComponent<Props> {
  handleSettingToggle = (key: string) => {
    const { debug, dispatch } = this.props;
    dispatch(debugFlagToggle(key, !debug[key]));
  };

  render() {
    const { debug } = this.props;

    return (
      <Screen title="Debug">
        <OptionRow
          label="Distinguish unread messages"
          defaultValue={debug.highlightUnreadMessages}
          onValueChange={() => this.handleSettingToggle('highlightUnreadMessages')}
        />
        <OptionRow
          label="Do not mark messages read on scroll"
          defaultValue={debug.doNotMarkMessagesAsRead}
          onValueChange={() => this.handleSettingToggle('doNotMarkMessagesAsRead')}
        />
        <OptionRow
          label="Log details about data (Redux state and actions)"
          defaultValue={debug.logReduxData}
          onValueChange={() => this.handleSettingToggle('logReduxData')}
        />
        <OptionRow
          label="Try console.error"
          defaultValue={false}
          onValueChange={() => console.error('hello error, from Zulip')}
        />
        <OptionRow
          label="Try console.warn"
          defaultValue={false}
          onValueChange={() => console.warn('hello warn, from Zulip')}
        />
        <OptionRow
          label="Try console.log"
          defaultValue={false}
          onValueChange={() => console.log('hello log, from Zulip')}
        />
        <OptionRow
          label="Try console.info"
          defaultValue={false}
          onValueChange={() => console.info('hello info, from Zulip')}
        />
        <OptionRow
          label="Try console.debug"
          defaultValue={false}
          onValueChange={() => console.debug('hello debug, from Zulip')}
        />
      </Screen>
    );
  }
}

export default connect((state: GlobalState) => ({
  debug: getSession(state).debug,
}))(DebugScreen);
