/* @flow strict-local */
import type { InitialData } from './initialDataTypes';
import type { Auth } from './transportTypes';
import type { Narrow } from './apiTypes';
import type { CrossRealmBot, User } from './modelTypes';
import { apiPost } from './apiFetch';
import { AvatarURL } from '../utils/avatar';

type RegisterForEventsParams = {|
  apply_markdown?: boolean,
  client_gravatar?: boolean,
  all_public_streams?: boolean,
  event_types?: string[],
  fetch_event_types?: string[],
  include_subscribers?: boolean,
  narrow?: Narrow,
  queue_lifespan_secs?: number,
  client_capabilities?: {|
    notification_settings_null: boolean,
    bulk_message_deletion: boolean,
    user_avatar_url_field_optional: boolean,
  |},
|};

type UnTransformUserLike = <T>(T) => {| ...T, avatar_url: string |};
type RawInitialData = {|
  ...InitialData,
  realm_users: $Call<UnTransformUserLike, User>[],
  realm_non_active_users: $Call<UnTransformUserLike, User>[],
  cross_realm_bots: $Call<UnTransformUserLike, CrossRealmBot>[],
|};

export const transformUserOrBot = <T: User | CrossRealmBot>(
  rawUserOrBot: {| ...T, avatar_url: string |},
  realm: URL,
): T => {
  const { avatar_url: rawAvatarUrl, user_id: userId, email } = rawUserOrBot;

  return {
    ...rawUserOrBot,
    avatar_url: AvatarURL.fromUserOrBotData({ rawAvatarUrl, userId, email, realm }),
  };
};

const transform = (rawInitialData: RawInitialData, auth: Auth): InitialData => ({
  ...rawInitialData,
  realm_users: rawInitialData.realm_users.map(rawUser =>
    transformUserOrBot<User>(rawUser, auth.realm),
  ),
  realm_non_active_users: rawInitialData.realm_non_active_users.map(rawNonActiveUser =>
    transformUserOrBot<User>(rawNonActiveUser, auth.realm),
  ),
  cross_realm_bots: rawInitialData.cross_realm_bots.map(rawCrossRealmBot =>
    transformUserOrBot<CrossRealmBot>(rawCrossRealmBot, auth.realm),
  ),
});

/** See https://zulip.com/api/register-queue */
export default async (auth: Auth, params: RegisterForEventsParams): Promise<InitialData> => {
  const { narrow, event_types, fetch_event_types, client_capabilities } = params;
  const rawInitialData = await apiPost(auth, 'register', {
    ...params,
    narrow: JSON.stringify(narrow),
    event_types: JSON.stringify(event_types),
    fetch_event_types: JSON.stringify(fetch_event_types),
    client_capabilities: JSON.stringify(client_capabilities),
  });
  return transform(rawInitialData, auth);
};
