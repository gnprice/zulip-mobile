/* @flow strict-local */
import type { ApiResponse, Auth } from '../transportTypes';
import { apiPatch } from '../apiFetch';

export default async (auth: Auth, streamName: string, topic: string): Promise<ApiResponse> =>
  apiPatch(auth, 'users/me/subscriptions/muted_topics', {
    stream: streamName,
    topic,
    op: 'remove',
  });
