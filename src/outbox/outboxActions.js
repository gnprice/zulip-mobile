/* @flow strict-local */
import parseMarkdown from 'zulip-markdown-parser';
import {
  keyFromNarrow,
  PmNarrow,
  CleanNarrow,
  TopicNarrow,
  StreamOrTopicNarrow,
} from '../utils/narrow.js';

import * as logging from '../utils/logging';
import type {
  Dispatch,
  GetState,
  GlobalState,
  NamedUser,
  Outbox,
  Stream,
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
import { getSelfUserDetail, getUsersById } from '../users/userSelectors';
import { getUsersAndWildcards } from '../users/userHelpers';

import { BackoffMachine } from '../utils/async';
import { NULL_USER } from '../nullObjects';
import { getStreamsById } from '../subscriptions/subscriptionSelectors';

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

      await api.sendMessage(auth, {
        type: item.type,
        to: item.sendTo,
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
  const backoffMachine = new BackoffMachine();
  while (!trySendMessages(dispatch, getState)) {
    await backoffMachine.wait();
  }
  dispatch(toggleOutboxSending(false));
};

const mapEmailsToUsers = (usersById, userIds, selfDetail) =>
  userIds
    .map(id => {
      const user = usersById.get(id) || NULL_USER;
      return { email: user.email, id: user.user_id, full_name: user.full_name };
    })
    .concat({ email: selfDetail.email, id: selfDetail.user_id, full_name: selfDetail.full_name });

// TODO type: `string | NamedUser[]` is a bit confusing.
type DataFromNarrow = {|
  type: 'private' | 'stream',
  display_recipient: string | NamedUser[],
  subject: string,
  sendTo: string,
|};

const extractTypeToAndSubjectFromNarrow = (
  narrow: CleanNarrow,
  usersById: Map<number, User>,
  streamsById: Map<number, Stream>,
  selfDetail: { email: string, user_id: number, full_name: string },
): DataFromNarrow => {
  /* TODO merge:

        const to = ((): string => {
        const { narrow } = item;
        // TODO: can this test be `if (item.type === private)`?
        if (isPrivateOrGroupNarrow(narrow)) {
          return narrow[0].operand;
        } else {
          // HACK: the server attempts to interpret this argument as JSON, then
          // CSV, then a literal. To avoid misparsing, always use JSON.
          return keyFromNarrow([item.display_recipient]);
        }
      })();

   */

  if (narrow instanceof PmNarrow) {
    const recipients = mapEmailsToUsers(usersById, narrow.userIds, selfDetail);
    return {
      type: 'private',
      display_recipient: recipients,
      subject: '',
      sendTo: recipients
        .map(r => r.email)
        .sort()
        .join(','),
    };
  } else if (narrow instanceof StreamOrTopicNarrow) {
    const streamName = streamsById.get(narrow.streamId)?.name;
    if (streamName === undefined) {
      throw new Error(`unknown stream ${narrow.streamId}`);
    }
    const topic = narrow instanceof TopicNarrow ? narrow.topic : '(no topic)';
    return {
      type: 'stream',
      display_recipient: streamName,
      subject: topic,
      sendTo: streamName,
    };
  }
  throw new Error('expected PM, stream, or topic narrow');
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

export const addToOutbox = (narrow: CleanNarrow, content: string) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const state = getState();
  const userDetail = getSelfUserDetail(state);

  const localTime = Math.round(new Date().getTime() / 1000);
  dispatch(
    messageSendStart({
      isSent: false,
      ...extractTypeToAndSubjectFromNarrow(
        narrow,
        getUsersById(state),
        getStreamsById(state),
        userDetail,
      ),
      markdownContent: content,
      content: getContentPreview(content, state),
      timestamp: localTime,
      id: localTime,
      sender_full_name: userDetail.full_name,
      sender_email: userDetail.email,
      avatar_url: userDetail.avatar_url,
      isOutbox: true,
      reactions: [],
    }),
  );
  dispatch(sendOutbox());
};
