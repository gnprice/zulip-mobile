/* @flow strict-local */
import { createSelector } from 'reselect';

import type { GlobalState, Narrow, Selector, Stream, Subscription } from '../types';
import { NULL_SUBSCRIPTION } from '../nullObjects';
import { streamNameFromNarrow } from '../utils/narrow';
import { getSubscriptions, getStreams } from '../directSelectors';

export const getStreamsById: Selector<{ [number]: Stream }> = createSelector(getStreams, streams =>
  streams.reduce((streamsById, stream) => {
    streamsById[stream.stream_id] = stream;
    return streamsById;
  }, ({}: { [number]: Stream })),
);

export const getSubscriptionsById: Selector<{ [number]: Subscription }> = createSelector(
  getSubscriptions,
  subscriptions =>
    subscriptions.reduce((subsById, subscription) => {
      subsById[subscription.stream_id] = subscription;
      return subsById;
    }, ({}: { [number]: Subscription })),
);

export const getIsActiveStreamSubscribed: Selector<boolean, Narrow> = createSelector(
  (state, narrow) => narrow,
  state => getSubscriptions(state),
  (narrow, subscriptions) => {
    const streamName = streamNameFromNarrow(narrow);
    if (streamName === null) {
      return true;
    }
    return subscriptions.find(sub => streamName === sub.name) !== undefined;
  },
);

export const getSubscribedStreams: Selector<Subscription[]> = createSelector(
  getStreams,
  getSubscriptions,
  (allStreams, allSubscriptions) =>
    allSubscriptions.map(subscription => ({
      ...subscription,
      ...allStreams.find(stream => stream.stream_id === subscription.stream_id),
    })),
);

export const getStreamFromId: Selector<Stream, number> = createSelector(
  (state, streamId) => streamId,
  state => getStreams(state),
  (streamId, streams, params) => {
    const stream = streams.find(x => x.stream_id === streamId);
    if (!stream) {
      throw new Error(`getStreamFromId: missing stream: id ${streamId}`);
    }
    return stream;
  },
);

/**
 * The stream with this name, or undefined if none.
 *
 * For use in contexts where the UI doesn't already assume there is a valid,
 * known stream with this name.
 *
 * See `getStreamFromName` for use in typical contexts.
 */
export const tryGetStreamFromName: Selector<Stream | void, string> = createSelector(
  (state, name) => name,
  state => getStreams(state),
  (name, streams) => streams.find(x => x.name === name),
);

/**
 * The stream with this name; throws if none.
 *
 * For use in all contexts in the app where a stream with this name is
 * assumed; e.g. in a narrow to this stream, or to a topic within it, or the
 * topic list or another screen located behind such a narrow.
 *
 * See `tryGetStreamFromName` for use where we don't assume a stream exists.
 */
export const getStreamFromName = (state: GlobalState, name: string): Stream => {
  const stream = tryGetStreamFromName(state, name);
  if (!stream) {
    throw new Error(`getStreamFromName: missing stream: name ${name}`);
  }
  return stream;
};

export const getSubscriptionFromId: Selector<Subscription, number> = createSelector(
  (state, streamId) => streamId,
  state => getSubscriptions(state),
  (streamId, subscriptions) =>
    subscriptions.find(x => x.stream_id === streamId) || NULL_SUBSCRIPTION,
);

export const getIsActiveStreamAnnouncementOnly: Selector<boolean, Narrow> = createSelector(
  (state, narrow) => narrow,
  state => getStreams(state),
  (narrow, streams) => {
    const streamName = streamNameFromNarrow(narrow);
    if (streamName === null) {
      return false;
    }
    const stream = streams.find(stream_ => streamName === stream_.name);
    return stream ? stream.is_announcement_only : false;
  },
);
