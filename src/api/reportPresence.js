/* @flow strict-local */
import type { ApiResponse, Auth } from './transportTypes';
import type { UserPresence } from './apiTypes';
import { apiPost } from './apiFetch';

type ApiResponseWithPresence = {|
  ...ApiResponse,
  server_timestamp: number,
  // With Zulip 3.0 it becomes possible to get these keyed by user ID
  // rather than email: https://chat.zulip.org/api/register-queue#parameter-slim_presence
  presences: {| [email: string]: UserPresence |},
|};

/** See https://zulip.readthedocs.io/en/latest/subsystems/presence.html . */
export default (
  auth: Auth,
  isActive: boolean = true,
  newUserInput: boolean = false,
): Promise<ApiResponseWithPresence> =>
  apiPost(auth, 'users/me/presence', {
    status: isActive ? 'active' : 'idle',
    new_user_input: newUserInput,
  });
