/* @flow strict-local */
import type { Stream } from '../types';
import { withApiWrapped as withApi } from '../apiReduxThunk';

export const createNewStream = (
  name: string,
  description: string,
  principals: string[],
  isPrivate: boolean,
  // TODO $FlowFixMe perhaps because of optional params on createStream
) => withApi(api => api.createStream(name, description, principals, isPrivate));

export const updateExistingStream = (
  id: number,
  initialValues: Stream,
  newValues: {| name: string, description: string, isPrivate: boolean |},
) =>
  withApi(async api => {
    if (initialValues.name !== newValues.name) {
      // Stream names might contain unsafe characters so we must encode it first.
      await api.updateStream(id, 'new_name', JSON.stringify(newValues.name));
    }
    if (initialValues.description !== newValues.description) {
      // Description might contain unsafe characters so we must encode it first.
      await api.updateStream(id, 'description', JSON.stringify(newValues.description));
    }
    if (initialValues.invite_only !== newValues.isPrivate) {
      await api.updateStream(id, 'is_private', newValues.isPrivate);
    }
  });

export const togglePinStream = (streamId: number, value: boolean) =>
  withApi(api => api.togglePinStream(streamId, value));

export const toggleMuteStream = (streamId: number, value: boolean) =>
  withApi(api => api.toggleMuteStream(streamId, value));
