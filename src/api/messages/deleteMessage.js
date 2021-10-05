/* @flow strict */
import type { ApiResponse, Auth } from '../transportTypes';
import { apiPatch } from '../apiFetch';

export default async (auth: Auth, id: number): Promise<ApiResponse> =>
  apiPatch(auth, `messages/${id}`, {
    content: '',
  });
