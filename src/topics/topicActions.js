/* @flow strict-local */
import type { GetState, Dispatch, Narrow, Topic, Action } from '../types';
import { INIT_TOPICS } from '../actionConstants';
import { isStreamNarrow } from '../utils/narrow';
import { getStreams } from '../selectors';
import { withApi } from '../apiReduxThunk';

export const initTopics = (topics: Topic[], streamId: number): Action => ({
  type: INIT_TOPICS,
  topics,
  streamId,
});

export const fetchTopics = (streamId: number) =>
  withApi(async (api, auth, dispatch) => {
    const { topics } = await api.getTopics(auth, streamId);
    dispatch(initTopics(topics, streamId));
  });

export const fetchTopicsForActiveStream = (narrow: Narrow) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const state = getState();

  if (!isStreamNarrow(narrow)) {
    return;
  }

  const streams = getStreams(state);
  const stream = streams.find(sub => narrow[0].operand === sub.name);
  if (!stream) {
    return;
  }
  dispatch(fetchTopics(stream.stream_id));
};
