/* @flow strict-local */
import type { Node } from 'react';
import type { IntlShape } from 'react-intl';
import type { DangerouslyImpreciseStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

import type { Topic, Message, ReactionType, UserId } from './api/apiTypes';
import { type Outbox } from './localModelTypes';
import type { PmKeyUsers } from './utils/recipient';

export type * from './generics';
export type * from './reduxTypes';
export type * from './api/apiTypes';
export type * from './localModelTypes';
export type { Narrow } from './utils/narrow';

export { ensureUnreachable } from './generics';

/*
 * TODO as the name suggests, this should be broken down more specifically.
 * Each use should be one of ViewStyleProp, TextStyleProp, ImageStyleProp.
 */
export type Style = DangerouslyImpreciseStyleProp;

export type InputSelection = {|
  +start: number,
  +end: number,
|};

export type EmojiType = 'image' | 'unicode';

/** An aggregate of all the reactions with one emoji to one message. */
export type AggregatedReaction = {|
  code: string,
  count: number,
  name: string,
  selfReacted: boolean,
  type: ReactionType,
  users: $ReadOnlyArray<UserId>,
|};

/**
 * ID and original topic/content of an already-sent message that the
 * user is currently editing.
 */
export type EditMessage = {|
  id: number,
  content: string,
  topic: string,
|};

export type TopicExtended = {|
  ...$Exact<Topic>,
  isMuted: boolean,
  unreadCount: number,
|};

// Name and type copied from docs:
//   https://formatjs.io/docs/react-intl/api/#formatmessage
type MessageFormatPrimitiveValue = string | number | boolean | null | void;

/**
 * A string to show, translated, in the UI as a plain string.
 *
 * For when formatting is needed (and possible), see `LocalizableReactText`.
 */
export type LocalizableText =
  | string
  | {| +text: string, +values?: {| +[string]: MessageFormatPrimitiveValue |} |};

/**
 * A string to show, translated, in the UI as a React node.
 *
 * Here the values can be React nodes, and so the translated result will be
 * a React node.  For when the result is a plain string and React nodes
 * aren't permitted in the values, see `LocalizableText`.
 */
export type LocalizableReactText =
  | string
  | {| +text: string, +values?: {| +[string]: MessageFormatPrimitiveValue | Node |} |};

/**
 * Usually called `_`, and invoked like `_('Message')` -> `'Nachricht'`.
 *
 * To use, put these two lines at the top of a React component's body:
 *
 *     static contextType = TranslationContext;
 *     context: GetText;
 *
 * and then in methods, say `const _ = this.context`.
 *
 * Alternatively, for when `context` is already in use: use `withGetText`
 * and then say `const { _ } = this.props`.
 *
 * @prop intl - The full react-intl API, for more complex situations.
 */
export type GetText = {|
  (message: string, values?: {| +[string]: MessageFormatPrimitiveValue |}): string,
  intl: IntlShape,
|};

export type TimeMessageListElement = {|
  type: 'time',

  // TODO(facebook/flow#4509): Read-only tuple type, when supported
  key: [number, 0],

  timestamp: number,
  subsequentMessage: Message | Outbox,
|};

export type MessageMessageListElement = {|
  type: 'message',

  // TODO(facebook/flow#4509): Read-only tuple type, when supported
  key: [number, 2],

  message: Message | Outbox,
  isBrief: boolean,
|};

export type HeaderMessageListElement = {|
  type: 'header',

  // TODO(facebook/flow#4509): Read-only tuple type, when supported
  key: [number, 1],

  style: 'topic+date' | 'full',
  subsequentMessage: Message | Outbox,
|};

/**
 * Data object for a unit in the message list.
 *
 * Formerly called "message peers" and "HTML piece descriptors".
 *
 * A list of these is sortable by the `key` property, which holds a tuple
 * with two members:
 * - `.key[0]` is the message ID that the MessageListElement is related to.
 * - `.key[1]` is an integer representing whether the element is a
 *   TimeMessageListElement (0), HeaderMessageListElement (1), or
 *   MessageMessageListElement (2). The message list should present them in
 *   that order (0-2).
 *
 * See generateInboundEventEditSequence for where we implement the compare
 * function for `key`.
 */
export type MessageListElement =
  | TimeMessageListElement
  | MessageMessageListElement
  | HeaderMessageListElement;

// Check that all FooMessageListElement.key is reasonable.
//
// TODO(facebook/flow#4509): $ReadOnlyArray<number> is a proxy for tuple
//   type [number, number] with its two members marked as covariant. Flow
//   has no syntax for that yet.
// eslint-disable-next-line no-unused-expressions
(k: $PropertyType<MessageListElement, 'key'>): $ReadOnlyArray<number> => k;

export type TimingItemType = {|
  text: string,
  startMs: number,
  endMs: number,
|};

/**
 * Summary of a PM conversation (either 1:1 or group PMs).
 */
export type PmConversationData = {|
  /**
   * A comma-separated (numerically-)sorted sequence of the IDs of the users
   * involved in this conversation.  Omits the self-user just if there are
   * exactly two recipients.
   *
   * (This unusual specification is intended to simultaneously match the
   * disjoint key-spaces of `unreadPms` and `unreadHuddles`.)
   */
  key: string,

  keyRecipients: PmKeyUsers,

  /** The most recent message in this conversation. */
  msgId: number,

  /** The count of unread messages in this conversation. */
  unread: number,
|};
