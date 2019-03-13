/* @flow strict-local */
import React, { PureComponent } from 'react';
import type { ComponentType } from 'react';
import { connect } from 'react-redux';

import type { Dispatch, Narrow, Stream } from '../types';
import {
  isHomeNarrow,
  isPrivateNarrow,
  isGroupNarrow,
  isSpecialNarrow,
  isStreamNarrow,
  isTopicNarrow,
  streamNarrow,
  caseNarrowDefault,
} from '../utils/narrow';
import { getStreamForName } from '../selectors';
import NavButton from '../nav/NavButton';
import { doNarrow, navigateToTopicList } from '../actions';

import InfoNavButtonStream from './InfoNavButtonStream';
import InfoNavButtonPrivate from './InfoNavButtonPrivate';
import InfoNavButtonGroup from './InfoNavButtonGroup';

type Props = {| color: string, narrow: Narrow |};
type NarrowNavButton = ComponentType<Props>;
type NarrowNavButtonCandidate = {
  isFunc: Narrow => boolean,
  ButtonComponent: NarrowNavButton | null,
};

const infoButtonHandlers: NarrowNavButtonCandidate[] = [
  { isFunc: isHomeNarrow, ButtonComponent: null },
  { isFunc: isSpecialNarrow, ButtonComponent: null },
  { isFunc: isStreamNarrow, ButtonComponent: InfoNavButtonStream },
  { isFunc: isTopicNarrow, ButtonComponent: InfoNavButtonStream },
  { isFunc: isPrivateNarrow, ButtonComponent: InfoNavButtonPrivate },
  { isFunc: isGroupNarrow, ButtonComponent: InfoNavButtonGroup },
];

class _ExtraNavButtonStream extends PureComponent<{|
  dispatch: Dispatch,
  color: string,
  stream: Stream,
|}> {
  handlePress = () => {
    const { dispatch, stream } = this.props;
    dispatch(navigateToTopicList(stream.stream_id));
  };

  render() {
    return <NavButton name="list" color={this.props.color} onPress={this.handlePress} />;
  }
}

const ExtraNavButtonStream = connect((state, props) => ({
  stream: getStreamForName(state, props.streamName),
}))(_ExtraNavButtonStream);

class ExtraNavButtonTopic extends PureComponent<{|
  dispatch: Dispatch,
  streamName: string,
  color: string,
|}> {
  handlePress = () => {
    const { dispatch, streamName } = this.props;
    dispatch(doNarrow(streamNarrow(streamName)));
  };

  render() {
    return <NavButton name="arrow-up" color={this.props.color} onPress={this.handlePress} />;
  }
}

const makeButton = (handlers): NarrowNavButton => props => {
  const handler = handlers.find(x => x.isFunc(props.narrow)) || null;
  const SpecificButton = handler && handler.ButtonComponent;
  return SpecificButton && <SpecificButton {...props} />;
};

export const InfoButton = makeButton(infoButtonHandlers);

export const ExtraButton = connect()(
  ({ narrow, color, dispatch }: {| ...Props, dispatch: Dispatch |}) =>
    caseNarrowDefault(
      narrow,
      {
        stream: streamName => <ExtraNavButtonStream streamName={streamName} color={color} />,
        topic: streamName => (
          <ExtraNavButtonTopic streamName={streamName} color={color} dispatch={dispatch} />
        ),
      },
      () => null,
    ),
);
