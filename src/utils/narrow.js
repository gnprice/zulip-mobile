/* @flow strict-local */
import isEqual from 'lodash.isequal';
import unescape from 'lodash.unescape';

import type { Narrow, Message, Outbox, Stream, UserOrBot } from '../types';
import { normalizeRecipients } from './recipient';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-use-before-define */

export class CleanNarrow {
  /** A unique canonical name for the narrow, suitable for use as a map key. */
  key(): string {
    throw new Error('must implement');
  }

  /** Convert into an old-style API narrow object, with user emails and stream names. */
  apiStringsNarrow(data: {
    allUsersById: Map<number, UserOrBot>,
    streamsById: Map<number, Stream>,
  }): Narrow | null {
    throw new Error('must implement');
  }
}

export type DualNarrow<T: CleanNarrow = CleanNarrow> = { clean: T, strings: Narrow };

export class StreamOrTopicNarrow extends CleanNarrow {
  streamId: number;

  /** Best-effort only, for e.g. debugging. */
  streamName: string | void;
}

export class StreamNarrow extends StreamOrTopicNarrow {
  key() {
    return `stream:${this.streamId}`;
  }

  apiStringsNarrow(data: { streamsById: Map<number, Stream> }) {
    const stream = data.streamsById.get(this.streamId);
    return stream ? streamNarrow(stream.name) : null;
  }
}

export class TopicNarrow extends StreamOrTopicNarrow {
  topic: string;

  key() {
    return `topic:${this.streamId}:${this.topic}`;
  }

  apiStringsNarrow(data: { streamsById: Map<number, Stream> }): Narrow | null {
    const stream = data.streamsById.get(this.streamId);
    return stream ? topicNarrow(stream.name, this.topic) : null;
  }
}

export class PmNarrow extends CleanNarrow {
  /**
   * IDs of the slightly quirky set of users we identify the PM thread with.
   *
   * This is all the users in the conversation... except the self user...
   * except that in the self-1:1 thread, it has the self user after all.
   *
   * In particular always nonempty.
   */
  userIds: number[];

  /** Best-effort only, for e.g. debugging. */
  emails: string[] | void;

  constructor(userIds: number[], emails?: string[]) {
    super();
    this.userIds = userIds;
    this.emails = emails;
  }

  static fromUsers(users: $ReadOnlyArray<UserOrBot>): PmNarrow {
    return new PmNarrow(users.map(u => u.user_id), users.map(u => u.email));
  }

  static fromUser(user: UserOrBot): PmNarrow {
    return PmNarrow.fromUsers([user]);
  }

  static dualFromUser(user: UserOrBot): DualNarrow<PmNarrow> {
    return { clean: PmNarrow.fromUser(user), strings: privateNarrow(user.email) };
  }

  key() {
    return `pm:${this.userIds.join(',')}`;
  }

  /**
   * The users that identify a PM narrow in the UI.
   *
   * This is all users except the self user... except on the self-1:1
   * conversation, for which it includes the self user after all.
   *
   * Throws if a user can't be found.
   */
  // This happens to be the same set of users we use internally, but that
  // might change.
  getDisplayUsers(
    allUsersById: Map<number, UserOrBot>,
    ownUserId: number,
  ): $ReadOnlyArray<UserOrBot> {
    const { userIds } = this;
    const users = userIds.map(id => allUsersById.get(id)).filter(Boolean);
    if (users.length !== userIds.length) {
      throw new Error('missing user'); // TODO etc
    }
    return users;
  }
}

export class UniqueNarrow extends CleanNarrow {}

export class AllMessagesNarrow extends UniqueNarrow {}

export class StarredNarrow extends UniqueNarrow {}

export class MentionedNarrow extends UniqueNarrow {}

export class AllPmsNarrow extends UniqueNarrow {}

export class SearchNarrow extends CleanNarrow {
  query: string;
}

export const isSameNarrow = (narrow1: Narrow, narrow2: Narrow): boolean =>
  Array.isArray(narrow1) && Array.isArray(narrow2) && isEqual(narrow1, narrow2);

export const parseNarrowString = (narrowStr: string): Narrow => JSON.parse(unescape(narrowStr));

export const HOME_NARROW: Narrow = [];

export const HOME_NARROW_STR: string = '[]';

export const privateNarrow = (email: string): Narrow => [
  {
    operator: 'pm-with',
    operand: email,
  },
];

export const groupNarrow = (emails: string[]): Narrow => [
  {
    operator: 'pm-with',
    operand: emails.join(),
  },
];

export const specialNarrow = (operand: string): Narrow => [
  {
    operator: 'is',
    operand,
  },
];

export const STARRED_NARROW = specialNarrow('starred');

export const STARRED_NARROW_STR = JSON.stringify(STARRED_NARROW);

export const MENTIONED_NARROW = specialNarrow('mentioned');

export const MENTIONED_NARROW_STR = JSON.stringify(MENTIONED_NARROW);

export const ALL_PRIVATE_NARROW = specialNarrow('private');

export const ALL_PRIVATE_NARROW_STR = JSON.stringify(ALL_PRIVATE_NARROW);

export const streamNarrow = (stream: string): Narrow => [
  {
    operator: 'stream',
    operand: stream,
  },
];

export const topicNarrow = (stream: string, topic: string): Narrow => [
  {
    operator: 'stream',
    operand: stream,
  },
  {
    operator: 'topic',
    operand: topic,
  },
];

export const SEARCH_NARROW = (query: string): Narrow => [
  {
    operator: 'search',
    operand: query,
  },
];

type NarrowCases<T> = {|
  stream: (name: string) => T,
  topic: (streamName: string, topic: string) => T,
  pm: (emails: string[]) => T,

  home: () => T,
  starred: () => T,
  mentioned: () => T,
  allPrivate: () => T,
  search: (query: string) => T,
|};

/* prettier-ignore */
export function caseNarrow<T>(narrow: Narrow, cases: NarrowCases<T>): T {
  const err = (): empty => {
    throw new Error(`bad narrow: ${JSON.stringify(narrow)}`);
  };

  switch (narrow.length) {
    case 0: return cases.home();
    case 1:
      switch (narrow[0].operator) {
        case 'pm-with': {
            const emails = narrow[0].operand.split(',');
            return cases.pm(emails);
          }
        case 'is':
          switch (narrow[0].operand) {
            case 'starred': return cases.starred();
            case 'mentioned': return cases.mentioned();
            case 'private': return cases.allPrivate();
            default: return err();
          }
        case 'stream': return cases.stream(narrow[0].operand);
        case 'search': return cases.search(narrow[0].operand);
        default: return err();
      }
    case 2: return cases.topic(narrow[0].operand, narrow[1].operand);
    default: return err();
  }
}

export function caseNarrowPartial<T>(narrow: Narrow, cases: $Shape<NarrowCases<T>>): T {
  const err = (type: string) => (): empty => {
    throw new Error(`unexpected ${type} narrow: ${JSON.stringify(narrow)}`);
  };
  return caseNarrow(
    narrow,
    Object.assign(
      ({
        stream: err('stream'),
        topic: err('topic'),
        pm: err('PM'),
        home: err('home'),
        starred: err('starred'),
        mentioned: err('mentions'),
        allPrivate: err('all-private'),
        search: err('search'),
      }: NarrowCases<T>),
      cases,
    ),
  );
}

export function caseNarrowDefault<T>(
  narrow: Narrow,
  cases: $Shape<NarrowCases<T>>,
  defaultCase: () => T,
): T {
  return caseNarrow(
    narrow,
    Object.assign(
      ({
        stream: defaultCase,
        topic: defaultCase,
        pm: defaultCase,
        home: defaultCase,
        starred: defaultCase,
        mentioned: defaultCase,
        allPrivate: defaultCase,
        search: defaultCase,
      }: NarrowCases<T>),
      cases,
    ),
  );
}

export const isStreamNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { stream: () => true }, () => false);
export const isTopicNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { topic: () => true }, () => false);
export const isStreamOrTopicNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { stream: () => true, topic: () => true }, () => false);

export const isPrivateOrGroupNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { pm: () => true }, () => false);
export const isPrivateNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { pm: emails => emails.length === 1 }, () => false);
export const isGroupNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { pm: emails => emails.length > 1 }, () => false);

/**
 * The recipients' emails if a group PM narrow; else error.
 *
 * Any use of this probably means something higher up should be refactored
 * to use caseNarrow.
 */
export const emailsOfGroupNarrow = (narrow: Narrow): string[] =>
  caseNarrowPartial(narrow, {
    pm: emails => {
      if (emails.length === 1) {
        throw new Error('emailsOfGroupPmNarrow: got 1:1 narrow');
      }
      return emails;
    },
  });

export const isHomeNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { home: () => true }, () => false);
export const isSpecialNarrow = (narrow?: Narrow): boolean =>
  !!narrow
  && caseNarrowDefault(
    narrow,
    { starred: () => true, mentioned: () => true, allPrivate: () => true },
    () => false,
  );
export const isAllPrivateNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { allPrivate: () => true }, () => false);
export const isSearchNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { search: () => true }, () => false);

/** (For search narrows, just returns false.) */
export const isMessageInNarrow = (message: Message, narrow: Narrow, ownEmail: string): boolean => {
  const matchRecipients = (emails: string[]) => {
    const normalizedRecipients = normalizeRecipients(message.display_recipient);
    const normalizedNarrow = [...emails, ownEmail].sort().join(',');
    return normalizedRecipients === ownEmail || normalizedRecipients === normalizedNarrow;
  };

  const { flags } = message;
  if (!flags) {
    throw new Error('`message.flags` should be defined.');
  }

  return caseNarrow(narrow, {
    stream: name => name === message.display_recipient,
    topic: (streamName, topic) =>
      streamName === message.display_recipient && topic === message.subject,
    pm: matchRecipients,

    home: () => true,
    starred: () => flags.includes('starred'),
    mentioned: () => flags.includes('mentioned') || flags.includes('wildcard_mentioned'),
    allPrivate: () => message.type === 'private',
    search: () => false,
  });
};

export const canSendToNarrow = (narrow: Narrow): boolean =>
  caseNarrow(narrow, {
    stream: () => true,
    topic: () => true,
    pm: () => true,

    home: () => false,
    starred: () => false,
    mentioned: () => false,
    allPrivate: () => false,
    search: () => false,
  });

/** True just if `haystack` contains all possible messages in `needle`. */
export const narrowContains = (haystack: Narrow, needle: Narrow): boolean => {
  if (isHomeNarrow(haystack)) {
    return true;
  }
  if (isAllPrivateNarrow(haystack) && isPrivateOrGroupNarrow(needle)) {
    return true;
  }
  if (isStreamNarrow(haystack) && needle[0].operand === haystack[0].operand) {
    return true;
  }
  return JSON.stringify(needle) === JSON.stringify(haystack);
};

export const getNarrowFromMessage = (message: Message | Outbox, ownEmail: string) => {
  if (Array.isArray(message.display_recipient)) {
    const recipient =
      message.display_recipient.length > 1
        ? message.display_recipient.filter(x => x.email !== ownEmail)
        : message.display_recipient;
    return groupNarrow(recipient.map(x => x.email));
  }

  if (message.subject && message.subject.length) {
    return topicNarrow(message.display_recipient, message.subject);
  }

  return streamNarrow(message.display_recipient);
};
