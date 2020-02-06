/* @flow strict-local */
import { Clipboard, Share, Alert } from 'react-native';
import type { Auth, Dispatch, GetText, Message, Narrow, Outbox, Subscription } from '../types';
import type { BackgroundData } from '../webview/MessageList';
import {
  getNarrowFromMessage,
  isPrivateOrGroupNarrow,
  isStreamOrTopicNarrow,
  caseNarrowDefault,
} from '../utils/narrow';
import { isTopicMuted } from '../utils/message';
import * as api from '../api';
import { showToast } from '../utils/info';
import { doNarrow, startEditMessage, deleteOutboxMessage, navigateToEmojiPicker } from '../actions';
import { navigateToMessageReactionScreen } from '../nav/navActions';

// TODO really this belongs in a libdef.
export type ShowActionSheetWithOptions = (
  { options: string[], cancelButtonIndex: number },
  (number) => void,
) => void;

/** Description of a possible option for the action sheet. */
type ButtonDescription = {
  /** The callback. */
  ({
    auth: Auth,
    ownEmail: string,
    message: Message | Outbox,
    subscriptions: Subscription[],
    dispatch: Dispatch,
    _: GetText,
  }): void | Promise<void>,

  allow: (BackgroundData, Message | Outbox, Narrow) => boolean,

  title: string,

  /** The title of the alert-box that will be displayed if the callback throws. */
  // Required even when the callback can't throw (e.g., "Cancel"), since we can't
  // otherwise ensure that everything that _can_ throw has one.
  errorMessage: string,
};

const isAnOutboxMessage = (message: Message | Outbox): boolean => message.isOutbox;

const messageNotDeleted = (message: Message | Outbox): boolean =>
  message.content !== '<p>(deleted)</p>';

/** True just if the narrow represents a specific, whole, conversation. */
const isSingleConversation = (narrow: Narrow): boolean =>
  caseNarrowDefault(
    narrow,
    { topic: () => true, pm: () => true, groupPm: () => true },
    () => false,
  );

//
// Options for the action sheet go below: ...
//

/* eslint-disable no-empty-pattern */

const reply = ({ message, dispatch, ownEmail }) => {
  dispatch(doNarrow(getNarrowFromMessage(message, ownEmail), message.id));
};
reply.allow = ({}, message, narrow) => !isAnOutboxMessage(message) && !isSingleConversation(narrow);
reply.title = 'Reply';
reply.errorMessage = 'Failed to reply';

const copyToClipboard = async ({ _, auth, message }) => {
  const rawMessage = isAnOutboxMessage(message) /* $FlowFixMe: then really type Outbox */
    ? message.markdownContent
    : (await api.getRawMessageContent(auth, message.id)).raw_content;
  Clipboard.setString(rawMessage);
  showToast(_('Message copied'));
};
copyToClipboard.allow = ({}, message) => messageNotDeleted(message);
copyToClipboard.title = 'Copy to clipboard';
copyToClipboard.errorMessage = 'Failed to copy message to clipboard';

const editMessage = async ({ message, dispatch }) => {
  dispatch(startEditMessage(message.id, message.subject));
};
editMessage.allow = ({ ownUser }, message, narrow) =>
  !isAnOutboxMessage(message)
  && message.sender_email === ownUser.email
  // Our "edit message" UI only works in certain kinds of narrows.
  && (isStreamOrTopicNarrow(narrow) || isPrivateOrGroupNarrow(narrow));
editMessage.title = 'Edit message';
editMessage.errorMessage = 'Failed to edit message';

const deleteMessage = async ({ auth, message, dispatch }) => {
  if (isAnOutboxMessage(message)) {
    dispatch(deleteOutboxMessage(message.timestamp));
  } else {
    await api.deleteMessage(auth, message.id);
  }
};
deleteMessage.allow = ({ ownUser }, message, narrow) =>
  message.sender_email === ownUser.email && messageNotDeleted(message);
deleteMessage.title = 'Delete message';
deleteMessage.errorMessage = 'Failed to delete message';

const unmuteTopic = async ({ auth, message }) => {
  await api.unmuteTopic(auth, message.display_recipient, message.subject);
};
unmuteTopic.title = 'Unmute topic';
unmuteTopic.errorMessage = 'Failed to unmute topic';

const muteTopic = async ({ auth, message }) => {
  await api.muteTopic(auth, message.display_recipient, message.subject);
};
muteTopic.title = 'Mute topic';
muteTopic.errorMessage = 'Failed to mute topic';

const unmuteStream = async ({ auth, message, subscriptions }) => {
  const sub = subscriptions.find(x => x.name === message.display_recipient);
  if (sub) {
    await api.toggleMuteStream(auth, sub.stream_id, false);
  }
};
unmuteStream.title = 'Unmute stream';
unmuteStream.errorMessage = 'Failed to unmute stream';

const muteStream = async ({ auth, message, subscriptions }) => {
  const sub = subscriptions.find(x => x.name === message.display_recipient);
  if (sub) {
    await api.toggleMuteStream(auth, sub.stream_id, true);
  }
};
muteStream.title = 'Mute stream';
muteStream.errorMessage = 'Failed to mute stream';

const starMessage = async ({ auth, message }) => {
  await api.toggleMessageStarred(auth, [message.id], true);
};
starMessage.allow = ({ flags }, message) =>
  !isAnOutboxMessage(message) && !(message.id in flags.starred);
starMessage.title = 'Star message';
starMessage.errorMessage = 'Failed to star message';

const unstarMessage = async ({ auth, message }) => {
  await api.toggleMessageStarred(auth, [message.id], false);
};
unstarMessage.allow = ({ flags }, message) =>
  !isAnOutboxMessage(message) && message.id in flags.starred;
unstarMessage.title = 'Unstar message';
unstarMessage.errorMessage = 'Failed to unstar message';

const shareMessage = ({ message }) => {
  Share.share({
    message: message.content.replace(/<(?:.|\n)*?>/gm, ''),
  });
};
shareMessage.allow = ({}, message) => messageNotDeleted(message);
shareMessage.title = 'Share';
shareMessage.errorMessage = 'Failed to share message';

const addReaction = ({ message, dispatch }) => {
  dispatch(navigateToEmojiPicker(message.id));
};
addReaction.allow = ({}, message) => !isAnOutboxMessage(message) && messageNotDeleted(message);
addReaction.title = 'Add a reaction';
addReaction.errorMessage = 'Failed to add reaction';

const showReactions = ({ message, dispatch }) => {
  dispatch(navigateToMessageReactionScreen(message.id));
};
showReactions.allow = ({}, message) => message.reactions.length > 0;
showReactions.title = 'See who reacted';
showReactions.errorMessage = 'Failed to show reactions';

const cancel = params => {};
cancel.title = 'Cancel';
cancel.errorMessage = 'Failed to hide menu';

const allButtonsRaw = {
  // For messages
  addReaction,
  reply,
  copyToClipboard,
  shareMessage,
  editMessage,
  deleteMessage,
  starMessage,
  unstarMessage,
  showReactions,

  // For headers
  unmuteTopic,
  muteTopic,
  muteStream,
  unmuteStream,

  // All
  cancel,
};

//
// ... End of options for the action sheet.
//

type ButtonCode = $Keys<typeof allButtonsRaw>;

const allButtons: { [ButtonCode]: ButtonDescription } = allButtonsRaw;

type ConstructSheetParams = {|
  backgroundData: BackgroundData,
  message: Message | Outbox,
  narrow: Narrow,
|};

export const constructHeaderActionButtons = ({
  backgroundData: { mute, subscriptions },
  message,
}: ConstructSheetParams): ButtonCode[] => {
  const buttons: ButtonCode[] = [];
  if (message.type === 'stream') {
    if (isTopicMuted(message.display_recipient, message.subject, mute)) {
      buttons.push('unmuteTopic');
    } else {
      buttons.push('muteTopic');
    }
    const sub = subscriptions.find(x => x.name === message.display_recipient);
    if (sub && !sub.in_home_view) {
      buttons.push('unmuteStream');
    } else {
      buttons.push('muteStream');
    }
  }
  buttons.push('cancel');
  return buttons;
};

export const constructMessageActionButtons = ({
  backgroundData,
  message,
  narrow,
}: ConstructSheetParams): ButtonCode[] => {
  const buttons = [];
  if (showReactions.allow(backgroundData, message, narrow)) {
    buttons.push('showReactions');
  }
  if (addReaction.allow(backgroundData, message, narrow)) {
    buttons.push('addReaction');
  }
  if (reply.allow(backgroundData, message, narrow)) {
    buttons.push('reply');
  }
  if (copyToClipboard.allow(backgroundData, message, narrow)) {
    buttons.push('copyToClipboard');
  }
  if (shareMessage.allow(backgroundData, message, narrow)) {
    buttons.push('shareMessage');
  }
  if (editMessage.allow(backgroundData, message, narrow)) {
    buttons.push('editMessage');
  }
  if (deleteMessage.allow(backgroundData, message, narrow)) {
    buttons.push('deleteMessage');
  }
  if (unstarMessage.allow(backgroundData, message, narrow)) {
    buttons.push('unstarMessage');
  }
  if (starMessage.allow(backgroundData, message, narrow)) {
    buttons.push('starMessage');
  }
  buttons.push('cancel');
  return buttons;
};

/** Invoke the given callback to show an appropriate action sheet. */
export const showActionSheet = (
  isHeader: boolean,
  dispatch: Dispatch,
  showActionSheetWithOptions: ShowActionSheetWithOptions,
  _: GetText,
  params: ConstructSheetParams,
): void => {
  const optionCodes = isHeader
    ? constructHeaderActionButtons(params)
    : constructMessageActionButtons(params);
  const callback = buttonIndex => {
    (async () => {
      const pressedButton: ButtonDescription = allButtons[optionCodes[buttonIndex]];
      try {
        await pressedButton({
          dispatch,
          subscriptions: params.backgroundData.subscriptions,
          auth: params.backgroundData.auth,
          ownEmail: params.backgroundData.ownUser.email,
          _,
          ...params,
        });
      } catch (err) {
        Alert.alert(_(pressedButton.errorMessage), err.message);
      }
    })();
  };
  showActionSheetWithOptions(
    {
      ...(isHeader
        ? {
            title: `#${params.message.display_recipient} > ${params.message.subject}`,
          }
        : {}),
      options: optionCodes.map(code => _(allButtons[code].title)),
      cancelButtonIndex: optionCodes.length - 1,
    },
    callback,
  );
};
