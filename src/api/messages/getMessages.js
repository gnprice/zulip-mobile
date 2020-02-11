/* @flow strict-local */
import type { Auth, ApiResponseSuccess } from '../transportTypes';
import type { Anchor, Message, Narrow } from '../apiTypes';
import type { Reaction } from '../modelTypes';
import { apiGet } from '../apiFetch';

type ApiResponseMessages = {|
  ...ApiResponseSuccess,
  anchor: number,
  found_anchor?: boolean,
  found_newest?: boolean,
  found_oldest?: boolean,
  messages: Message[],
|};

/**
 * The variant of `Reaction` found in the actual server response.
 *
 * Note that reaction events have a *different* variation; see their
 * handling in `eventToAction`.
 */
type ServerReaction = $ReadOnly<{|
  ...$Diff<Reaction, {| user_id: mixed |}>,
  user: $ReadOnly<{|
    email: string,
    full_name: string,
    id: number,
  |}>,
|}>;

type ServerMessage = $ReadOnly<{|
  ...$Exact<Message>,
  reactions: $ReadOnlyArray<ServerReaction>,
|}>;

// The actual response from the server.  We convert the data from this to
// `ApiResponseMessages` before returning it to application code.
type ServerApiResponseMessages = {|
  ...ApiResponseMessages,
  messages: ServerMessage[],
|};

/** Exported for tests only. */
export const migrateMessages = (messages: ServerMessage[]): Message[] =>
  messages.map(message => {
    const { reactions, ...restMessage } = message;
    return {
      ...restMessage,
      reactions: reactions.map(reaction => {
        const { user, ...restReaction } = reaction;
        return {
          ...restReaction,
          user_id: user.id,
        };
      }),
    };
  });

const migrateResponse = response => {
  const { messages, ...restResponse } = response;
  return {
    ...restResponse,
    messages: migrateMessages(messages),
  };
};

/**
 * See https://zulipchat.com/api/get-messages
 *
 * Before Zulip 2.2, `anchor` must be a number; see `Anchor`.
 *
 * These values exist only in Zulip 1.8 or newer:
 *   * found_anchor
 *   * found_newest
 *   * found_oldest
 */
export default async (
  auth: Auth,
  narrow: Narrow,
  anchor: number, // or Anchor, for Zulip 2.2+
  numBefore: number,
  numAfter: number,
  useFirstUnread: boolean = false,
): Promise<ApiResponseMessages> => {
  const response: ServerApiResponseMessages = await apiGet(auth, 'messages', {
    narrow: JSON.stringify(narrow),
    anchor,
    num_before: numBefore,
    num_after: numAfter,
    apply_markdown: true,
    use_first_unread_anchor: useFirstUnread,
  });
  return migrateResponse(response);
};
