/* @flow strict-local */
import type { ApiResponse, Auth } from '../transportTypes';
import { apiPatch } from '../apiFetch';

/** See https://zulip.com/api/mute-topic */
export default async (
  auth: Auth,
  stream_id: number,
  topic: string,
  value: boolean,
): Promise<ApiResponse> =>
  apiPatch(auth, 'users/me/subscriptions/muted_topics', {
    stream_id,
    topic,
    op: value ? 'add' : 'remove',
  });
