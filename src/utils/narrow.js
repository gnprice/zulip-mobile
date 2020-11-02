/* @flow strict-local */
import isEqual from 'lodash.isequal';
import unescape from 'lodash.unescape';

import type { Narrow, Message, Outbox, Stream, UserOrBot } from '../types';
import { normalizeRecipients } from './recipient';

/*
 TODO on CleanNarrow:
  * Type-checker help check we don't JSON.stringify a clean or dual
    narrow
    * Convert them all to a specific helper function first.
  * Type-checker prevent trying an instanceof check that always fails
    because LHS is a DualNarrow
    * Use instead a method, like `CleanNarrow#isa`
    * Or better -- is there a way to get Flow to warn on this?  TS can.
      -> Nope, don't see it at https://flow.org/en/docs/linting/rule-reference/
         or any suggestion of it in a web search.

  * Implement `key` for all CleanNarrow subclasses
  * Make singletons for each UniqueNarrow subclass,
    and corresponding DualNarrow
  * go fix all these tests
  * In PmNarrow, require knowing self user ID; factories
    enforce normalization and provide sorting
    * Perhaps even provide different normalizations:
      all-users, traditional, and never-self
  * Revise migration instructions a bit: try converting to
    DualNarrow bottom-up
    * Follow type errors up through callers and data sources
    * Where something needs to pass an old Narrow somewhere,
      use `narrow.strings`
    * When reach a selector or thunk action, use `getDualNarrow`
      to convert any provided Narrow

 */

/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */

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

/**
 * A CleanNarrow plus an old strings-style Narrow, combined.
 *
 * Useful for migrating from old Narrow to CleanNarrow; see NarrowBridge.
 *
 * For fresh code, prefer plain CleanNarrow and its subclasses.
 */
export class DualNarrow<+T: CleanNarrow = CleanNarrow> {
  +clean: T;
  strings: Narrow;

  constructor(clean: T, strings: Narrow) {
    this.clean = clean;
    this.strings = strings;
  }

  static fromApiStringsNarrow(
    strings: Narrow,
    data: { allUsersByName: Map<string, UserOrBot>, streamsByName: Map<string, Stream> },
  ): DualNarrow<> | null {
    const clean: CleanNarrow | null = caseNarrowPartial(strings, {
      stream: name => {
        const stream = data.streamsByName.get(name);
        return stream ? new StreamNarrow(stream.stream_id, name) : null;
      },
      // TODO WIP finish other cases
    });
    return clean && new DualNarrow(clean, strings);
  }
}

/**
 * A narrow expressed in either old, or old + new, style.
 *
 * Useful for migrating from old Narrow to CleanNarrow, along a path
 *    Narrow -> NarrowBridge -> DualNarrow<> -> CleanNarrow (or subclass)
 *
 * Specifically:
 *
 *  * Code that takes a Narrow can immediately start taking NarrowBridge
 *    instead.  Where the layers below already take NarrowBridge, it can
 *    pass that; elsewhere, convert back to Narrow with `asApiStringNarrow`.
 *
 *  * Code that constructs a Narrow can construct a DualNarrow instead,
 *    where it has the appropriate data on hand.  Where it doesn't, some
 *    other layer may need to migrate first.
 *
 *    * Also, code that has a Narrow can upgrade it to a DualNarrow using
 *      `asDualNarrow`, where it has the appropriate data on hand.  This can
 *      be helpful for code that has many call sites, to let it and the
 *      layers under it press onward before the last call site migrates.
 *
 *  * Once all the callers of a given function (etc.) are passing DualNarrow
 *    rather than Narrow, the signature can be tightened from NarrowBridge
 *    to DualNarrow.  This propagates downward to its callees.
 *
 *  * Once a given piece of code takes DualNarrow, anything it does to
 *    inspect the value itself, it can switch to doing on the CleanNarrow
 *    copy rather than the old Narrow copy.
 *
 *  * Code that takes DualNarrow and no longer uses the old-Narrow part of
 *    it can tighten the signature again, to CleanNarrow (or a subclass).
 *    This propagates upward to callers.
 */
export type NarrowBridge = Narrow | DualNarrow<>;

export const asApiStringNarrow = (narrow: NarrowBridge): Narrow =>
  narrow instanceof DualNarrow ? narrow.strings : narrow;

/** Part of the migration strategy described at NarrowBridge. */
export const asDualNarrow = (
  narrow: NarrowBridge,
  data: { allUsersByName: Map<string, UserOrBot>, streamsByName: Map<string, Stream> },
): DualNarrow<> | null =>
  narrow instanceof DualNarrow ? narrow : DualNarrow.fromApiStringsNarrow(narrow, data);

export class StreamOrTopicNarrow extends CleanNarrow {
  streamId: number;

  /** Best-effort only, for e.g. debugging. */
  streamName: string | void;
}

export class StreamNarrow extends StreamOrTopicNarrow {
  constructor(streamId: number, streamName?: string) {
    super();
    this.streamId = streamId;
    this.streamName = streamName;
  }

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

  constructor(streamId: number, topic: string, streamName?: string) {
    super();
    this.streamId = streamId;
    this.streamName = streamName;
    this.topic = topic;
  }

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
    return new DualNarrow(PmNarrow.fromUser(user), privateNarrow(user.email));
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

/*
 *
 * Legacy Narrow objects
 *
 */

export const isSameNarrow = (narrow1: Narrow, narrow2: Narrow): boolean =>
  Array.isArray(narrow1) && Array.isArray(narrow2) && isEqual(narrow1, narrow2);

export const parseNarrowString = (narrowStr: string): Narrow => JSON.parse(unescape(narrowStr));

export const keyFromNarrow = (narrow: Narrow): string => JSON.stringify(narrow);

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

export const STARRED_NARROW_STR = keyFromNarrow(STARRED_NARROW);

export const MENTIONED_NARROW = specialNarrow('mentioned');

export const MENTIONED_NARROW_STR = keyFromNarrow(MENTIONED_NARROW);

export const ALL_PRIVATE_NARROW = specialNarrow('private');

export const ALL_PRIVATE_NARROW_STR = keyFromNarrow(ALL_PRIVATE_NARROW);

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
  home: () => T,
  pm: (email: string) => T,
  groupPm: (emails: string[]) => T,
  starred: () => T,
  mentioned: () => T,
  allPrivate: () => T,
  stream: (name: string) => T,
  topic: (streamName: string, topic: string) => T,
  search: (query: string) => T,
|};

/* prettier-ignore */
export function caseNarrow<T>(narrow: Narrow, cases: NarrowCases<T>): T {
  const err = (): empty => {
    throw new Error(`bad narrow: ${keyFromNarrow(narrow)}`);
  };

  switch (narrow.length) {
    case 0: return cases.home();
    case 1:
      switch (narrow[0].operator) {
        case 'pm-with':
          if (narrow[0].operand.indexOf(',') < 0) {
            return cases.pm(narrow[0].operand);
          } else { /* eslint-disable-line */
            const emails = narrow[0].operand.split(',');
            return cases.groupPm(emails);
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
    throw new Error(`unexpected ${type} narrow: ${keyFromNarrow(narrow)}`);
  };
  return caseNarrow(
    narrow,
    Object.assign(
      ({
        home: err('home'),
        pm: err('PM'),
        groupPm: err('group PM'),
        starred: err('starred'),
        mentioned: err('mentions'),
        allPrivate: err('all-private'),
        stream: err('stream'),
        topic: err('topic'),
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
        home: defaultCase,
        pm: defaultCase,
        groupPm: defaultCase,
        starred: defaultCase,
        mentioned: defaultCase,
        allPrivate: defaultCase,
        stream: defaultCase,
        topic: defaultCase,
        search: defaultCase,
      }: NarrowCases<T>),
      cases,
    ),
  );
}

export const isHomeNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { home: () => true }, () => false);

export const isPrivateNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { pm: () => true }, () => false);

export const isGroupNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { groupPm: () => true }, () => false);

/**
 * The recipients' emails if a group PM narrow; else error.
 *
 * Any use of this probably means something higher up should be refactored
 * to use caseNarrow.
 */
export const emailsOfGroupNarrow = (narrow: Narrow): string[] =>
  caseNarrowPartial(narrow, { groupPm: emails => emails });

export const isPrivateOrGroupNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { pm: () => true, groupPm: () => true }, () => false);

export const isSpecialNarrow = (narrow?: Narrow): boolean =>
  !!narrow
  && caseNarrowDefault(
    narrow,
    { starred: () => true, mentioned: () => true, allPrivate: () => true },
    () => false,
  );

export const isAllPrivateNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { allPrivate: () => true }, () => false);

export const isStreamNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { stream: () => true }, () => false);

export const isTopicNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { topic: () => true }, () => false);

export const isStreamOrTopicNarrow = (narrow?: Narrow): boolean =>
  !!narrow && caseNarrowDefault(narrow, { stream: () => true, topic: () => true }, () => false);

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
    home: () => true,
    stream: name => name === message.display_recipient,
    topic: (streamName, topic) =>
      streamName === message.display_recipient && topic === message.subject,
    pm: email => matchRecipients([email]),
    groupPm: matchRecipients,
    starred: () => flags.includes('starred'),
    mentioned: () => flags.includes('mentioned') || flags.includes('wildcard_mentioned'),
    allPrivate: () => message.type === 'private',
    search: () => false,
  });
};

export const canSendToNarrow = (narrow: Narrow): boolean =>
  caseNarrow(narrow, {
    pm: () => true,
    groupPm: () => true,
    stream: () => true,
    topic: () => true,
    home: () => false,
    starred: () => false,
    mentioned: () => false,
    allPrivate: () => false,
    search: () => false,
  });

export const narrowContainsOutbox = (haystack: Narrow, needle: Outbox): boolean =>
  caseNarrowPartial(haystack, {
    stream: name => needle.type === 'stream' && needle.display_recipient === name,
    topic: (streamName, topic) =>
      needle.type === 'stream'
      && needle.display_recipient === streamName
      && needle.subject === topic,
    pm: emails => emails === needle.display_recipient.map(r => r.email).join(','),

    home: () => true,
    allPrivate: () => needle.type === 'private',
    starred: () => false,

    // These two are uncommon cases it'd take some work to get right; just
    // leave the outbox messages out.
    mentioned: () => false,
    search: () => false,
  });

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
