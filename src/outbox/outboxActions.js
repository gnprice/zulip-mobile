/* @flow strict-local */
import parseMarkdown from 'zulip-markdown-parser';

import * as logging from '../utils/logging';
import type {
  Dispatch,
  GetState,
  GlobalState,
  NamedUser,
  Narrow,
  Outbox,
  User,
  Action,
} from '../types';
import {
  MESSAGE_SEND_START,
  TOGGLE_OUTBOX_SENDING,
  DELETE_OUTBOX_MESSAGE,
  MESSAGE_SEND_COMPLETE,
} from '../actionConstants';
import { getAuth } from '../selectors';
import * as api from '../api';
import { getUsersByEmail, getOwnUser } from '../users/userSelectors';
import { getUsersAndWildcards } from '../users/userHelpers';
import { isStreamNarrow, isPrivateOrGroupNarrow } from '../utils/narrow';
import progressiveTimeout from '../utils/progressiveTimeout';
import { NULL_USER } from '../nullObjects';

export const messageSendStart = (outbox: Outbox): Action => ({
  type: MESSAGE_SEND_START,
  outbox,
});

export const toggleOutboxSending = (sending: boolean): Action => ({
  type: TOGGLE_OUTBOX_SENDING,
  sending,
});

export const deleteOutboxMessage = (localMessageId: number): Action => ({
  type: DELETE_OUTBOX_MESSAGE,
  local_message_id: localMessageId,
});

export const messageSendComplete = (localMessageId: number): Action => ({
  type: MESSAGE_SEND_COMPLETE,
  local_message_id: localMessageId,
});

export const trySendMessages = (dispatch: Dispatch, getState: GetState): boolean => {
  const state = getState();
  const auth = getAuth(state);
  const outboxToSend = state.outbox.filter(outbox => !outbox.isSent);
  const oneWeekAgoTimestamp = Date.now() / 1000 - 60 * 60 * 24 * 7;
  try {
    outboxToSend.forEach(async item => {
      // If a message has spent over a week in the outbox, it's probably too
      // stale to try sending it.
      //
      // TODO: instead of just throwing these away, create an "unsendable" state
      // (including a reason for unsendability), and transition old messages to
      // that instead.
      if (item.timestamp < oneWeekAgoTimestamp) {
        dispatch(deleteOutboxMessage(item.id));
        return; // i.e., continue
      }

      // prettier-ignore
      const to =
        item.type === 'private'
            // This will include the self user, possibly twice.  That's
            // fine; on send, the server (since at least 2013) drops dupes
            // and normalizes whether to include the sender.
          ? item.display_recipient.map(r => r.email).join(',')
            // HACK: the server attempts to interpret this argument as JSON, then
            // CSV, then a literal. To avoid misparsing, always use JSON.
          : JSON.stringify([item.display_recipient]);

      await api.sendMessage(auth, {
        type: item.type,
        to,
        subject: item.subject,
        content: item.markdownContent,
        localId: item.timestamp,
        eventQueueId: state.session.eventQueueId,
      });
      dispatch(messageSendComplete(item.timestamp));
    });
    return true;
  } catch (e) {
    logging.warn(e);
    return false;
  }
};

export const sendOutbox = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  if (state.outbox.length === 0 || state.session.outboxSending) {
    return;
  }
  dispatch(toggleOutboxSending(true));
  while (!trySendMessages(dispatch, getState)) {
    await progressiveTimeout(); // eslint-disable-line no-await-in-loop
  }
  dispatch(toggleOutboxSending(false));
};

const mapEmailsToUsers = (usersByEmail, narrow, ownUser) => {
  const emails = narrow[0].operand.split(',');
  const result = [];
  for (const email of emails) {
    const user = usersByEmail.get(email);
    if (!user) {
      // If we have the user on a PMs screen where we don't actually know
      // about one of the users in the conversation, nothing good can
      // happen; bail.  (The most likely way this could happen is #3764.)
      throw new Error('missing user for recipient, skipping send');
    }
    result.push({ email, id: user.user_id, full_name: user.full_name });
  }
  result.push({ email: ownUser.email, id: ownUser.user_id, full_name: ownUser.full_name });
  return result;
};

// TODO type: `string | NamedUser[]` is a bit confusing.
type DataFromNarrow = {|
  type: 'private' | 'stream',
  display_recipient: string | NamedUser[],
  subject: string,
|};

const extractTypeToAndSubjectFromNarrow = (
  narrow: Narrow,
  usersByEmail: Map<string, User>,
  ownUser: User,
): DataFromNarrow => {
  if (isPrivateOrGroupNarrow(narrow)) {
    return {
      type: 'private',
      display_recipient: mapEmailsToUsers(usersByEmail, narrow, ownUser),
      subject: '',
    };
  } else if (isStreamNarrow(narrow)) {
    return { type: 'stream', display_recipient: narrow[0].operand, subject: '(no topic)' };
  }
  return { type: 'stream', display_recipient: narrow[0].operand, subject: narrow[1].operand };
};

const getContentPreview = (content: string, state: GlobalState): string => {
  try {
    return parseMarkdown(
      content,
      getUsersAndWildcards(state.users),
      state.streams,
      getAuth(state),
      state.realm.filters,
      state.realm.emoji,
    );
  } catch (e) {
    return content;
  }
};

export const addToOutbox = (narrow: Narrow, content: string) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const state = getState();
  const ownUser = getOwnUser(state);

  const localTime = Math.round(new Date().getTime() / 1000);
  dispatch(
    messageSendStart({
      isSent: false,
      ...extractTypeToAndSubjectFromNarrow(narrow, getUsersByEmail(state), ownUser),
      markdownContent: content,
      content: getContentPreview(content, state),
      timestamp: localTime,
      id: localTime,
      sender_full_name: ownUser.full_name,
      sender_email: ownUser.email,
      avatar_url: ownUser.avatar_url,
      isOutbox: true,
      reactions: [],
    }),
  );
  dispatch(sendOutbox());
};
