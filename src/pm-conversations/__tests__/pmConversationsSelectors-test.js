/* @flow strict-local */
import Immutable from 'immutable';

import { getRecentConversations } from '../pmConversationsSelectors';
import { ALL_PRIVATE_NARROW_STR } from '../../utils/narrow';
import { ZulipVersion } from '../../utils/zulipVersion';
import * as eg from '../../__tests__/lib/exampleData';

describe('getRecentConversations: legacy', () => {
  const zulipVersion = new ZulipVersion('2.0.0');

  const userJohn = eg.makeUser();
  const userMark = eg.makeUser();
  const keyForUsers = users =>
    users
      .map(u => u.user_id)
      .sort((a, b) => a - b)
      .map(String)
      .join(',');

  test('when no messages, return no conversations', () => {
    const state = eg.reduxState({
      accounts: [eg.makeAccount({ user: eg.selfUser, zulipVersion })],
      realm: eg.realmState({ email: eg.selfUser.email }),
      users: [eg.selfUser],
      narrows: Immutable.Map({
        [ALL_PRIVATE_NARROW_STR]: [],
      }),
      unread: {
        ...eg.baseReduxState.unread,
        pms: [],
        huddles: [],
      },
    });

    const actual = getRecentConversations(state);

    expect(actual).toEqual([]);
  });

  test('returns unique list of recipients, includes conversations with self', () => {
    const state = eg.reduxState({
      accounts: [eg.makeAccount({ user: eg.selfUser, zulipVersion })],
      realm: eg.realmState({ email: eg.selfUser.email }),
      users: [eg.selfUser, userJohn, userMark],
      narrows: Immutable.Map({
        [ALL_PRIVATE_NARROW_STR]: [0, 1, 2, 3, 4],
      }),
      messages: eg.makeMessagesState([
        eg.pmMessageFromTo(userJohn, [eg.selfUser], { id: 1 }),
        eg.pmMessageFromTo(userMark, [eg.selfUser], { id: 2 }),
        eg.pmMessageFromTo(userJohn, [eg.selfUser], { id: 3 }),
        eg.pmMessageFromTo(eg.selfUser, [], { id: 4 }),
        eg.pmMessageFromTo(userJohn, [eg.selfUser, userMark], { id: 0 }),
      ]),
      unread: {
        ...eg.baseReduxState.unread,
        pms: [
          { sender_id: eg.selfUser.user_id, unread_message_ids: [4] },
          { sender_id: userJohn.user_id, unread_message_ids: [1, 3] },
          { sender_id: userMark.user_id, unread_message_ids: [2] },
        ],
        huddles: [
          {
            user_ids_string: keyForUsers([eg.selfUser, userJohn, userMark]),
            unread_message_ids: [0],
          },
        ],
      },
    });

    const expectedResult = [
      { key: eg.selfUser.user_id.toString(), keyRecipients: [eg.selfUser], msgId: 4, unread: 1 },
      { key: userJohn.user_id.toString(), keyRecipients: [userJohn], msgId: 3, unread: 2 },
      { key: userMark.user_id.toString(), keyRecipients: [userMark], msgId: 2, unread: 1 },
      {
        key: keyForUsers([eg.selfUser, userJohn, userMark]),
        keyRecipients: [userJohn, userMark].sort((a, b) => a.user_id - b.user_id),
        msgId: 0,
        unread: 1,
      },
    ];

    const actual = getRecentConversations(state);

    expect(actual).toMatchObject(expectedResult);
  });

  test('returns recipients sorted by last activity', () => {
    const state = eg.reduxState({
      accounts: [eg.makeAccount({ user: eg.selfUser, zulipVersion })],
      realm: eg.realmState({ email: eg.selfUser.email }),
      users: [eg.selfUser, userJohn, userMark],
      narrows: Immutable.Map({
        [ALL_PRIVATE_NARROW_STR]: [1, 2, 3, 4, 5, 6],
      }),
      messages: eg.makeMessagesState([
        eg.pmMessageFromTo(userJohn, [eg.selfUser], { id: 2 }),
        eg.pmMessageFromTo(userMark, [eg.selfUser], { id: 1 }),
        eg.pmMessageFromTo(userJohn, [eg.selfUser], { id: 4 }),
        eg.pmMessageFromTo(userMark, [eg.selfUser], { id: 3 }),
        eg.pmMessageFromTo(userMark, [eg.selfUser, userJohn], { id: 5 }),
        eg.pmMessageFromTo(eg.selfUser, [], { id: 6 }),
      ]),
      unread: {
        ...eg.baseReduxState.unread,
        pms: [
          { sender_id: eg.selfUser.user_id, unread_message_ids: [6] },
          { sender_id: userJohn.user_id, unread_message_ids: [2, 4] },
          { sender_id: userMark.user_id, unread_message_ids: [1, 3] },
        ],
        huddles: [
          {
            user_ids_string: keyForUsers([eg.selfUser, userJohn, userMark]),
            unread_message_ids: [5],
          },
        ],
      },
    });

    const expectedResult = [
      { key: eg.selfUser.user_id.toString(), keyRecipients: [eg.selfUser], msgId: 6, unread: 1 },
      {
        key: keyForUsers([eg.selfUser, userJohn, userMark]),
        keyRecipients: [userJohn, userMark].sort((a, b) => a.user_id - b.user_id),
        msgId: 5,
        unread: 1,
      },
      { key: userJohn.user_id.toString(), keyRecipients: [userJohn], msgId: 4, unread: 2 },
      { key: userMark.user_id.toString(), keyRecipients: [userMark], msgId: 3, unread: 2 },
    ];

    const actual = getRecentConversations(state);

    expect(actual).toEqual(expectedResult);
  });
});

describe('getRecentConversations: modern', () => {
  const zulipVersion = new ZulipVersion('2.2.0');

  test('when no recent conversations, return no conversations', () => {
    const state = eg.reduxState({
      accounts: [eg.makeAccount({ user: eg.selfUser, zulipVersion })],
      realm: eg.realmState({ email: eg.selfUser.email }),
      users: [eg.selfUser],
    });

    expect(getRecentConversations(state)).toEqual([]);
  });

  test('returns unique list of recipients, includes conversations with self', () => {
    const users = [eg.selfUser, eg.makeUser({ name: 'john' }), eg.makeUser({ name: 'mark' })];
    const recentPrivateConversations = [
      { max_message_id: 4, user_ids: [] },
      { max_message_id: 3, user_ids: [users[1].user_id] },
      { max_message_id: 2, user_ids: [users[2].user_id] },
      { max_message_id: 0, user_ids: [users[1].user_id, users[2].user_id] },
    ];
    const unread = {
      ...eg.baseReduxState.unread,
      huddles: [
        {
          user_ids_string: [eg.selfUser.user_id, users[1].user_id, users[2].user_id]
            .sort((a, b) => a - b)
            .join(),
          unread_message_ids: [5],
        },
      ],
      pms: [
        {
          sender_id: eg.selfUser.user_id,
          unread_message_ids: [4],
        },
        {
          sender_id: users[1].user_id,
          unread_message_ids: [1, 3],
        },
        {
          sender_id: users[2].user_id,
          unread_message_ids: [2],
        },
      ],
    };

    const state = eg.reduxState({
      accounts: [eg.makeAccount({ user: eg.selfUser, zulipVersion })],
      realm: eg.realmState({ email: eg.selfUser.email }),
      users,
      recentPrivateConversations,
      unread,
    });

    expect(getRecentConversations(state)).toEqual([
      {
        key: eg.selfUser.user_id.toString(),
        keyRecipients: [],
        msgId: 4,
        unread: 1,
      },
      {
        key: users[1].user_id.toString(),
        keyRecipients: [users[1]],
        msgId: 3,
        unread: 2,
      },
      {
        key: users[2].user_id.toString(),
        keyRecipients: [users[2]],
        msgId: 2,
        unread: 1,
      },
      {
        key: [eg.selfUser.user_id, users[1].user_id, users[2].user_id].sort((a, b) => a - b).join(),
        keyRecipients: [users[1], users[2]].sort((a, b) => a.user_id - b.user_id),
        msgId: 0,
        unread: 1,
      },
    ]);
  });

  test('returns recipients sorted by last activity', () => {
    const users = [eg.selfUser, eg.makeUser({ name: 'john' }), eg.makeUser({ name: 'mark' })];
    const recentPrivateConversations = [
      { max_message_id: 6, user_ids: [] },
      { max_message_id: 5, user_ids: [users[1].user_id, users[2].user_id] },
      { max_message_id: 4, user_ids: [users[1].user_id] },
      { max_message_id: 3, user_ids: [users[2].user_id] },
    ];
    const unread = {
      streams: [],
      huddles: [
        {
          user_ids_string: [eg.selfUser.user_id, users[1].user_id, users[2].user_id]
            .sort((a, b) => a - b)
            .join(),
          unread_message_ids: [5],
        },
      ],
      pms: [
        {
          sender_id: eg.selfUser.user_id,
          unread_message_ids: [4],
        },
        {
          sender_id: users[1].user_id,
          unread_message_ids: [1, 3],
        },
        {
          sender_id: users[2].user_id,
          unread_message_ids: [2],
        },
      ],
      mentions: [],
    };

    const state = eg.reduxState({
      accounts: [eg.makeAccount({ user: eg.selfUser, zulipVersion })],
      realm: eg.realmState({ email: eg.selfUser.email }),
      users,
      recentPrivateConversations,
      unread,
    });

    expect(getRecentConversations(state)).toEqual([
      {
        key: eg.selfUser.user_id.toString(),
        keyRecipients: [],
        msgId: 6,
        unread: 1,
      },
      {
        key: [eg.selfUser.user_id, users[1].user_id, users[2].user_id].sort((a, b) => a - b).join(),
        keyRecipients: [users[1], users[2]].sort((a, b) => a.user_id - b.user_id),
        msgId: 5,
        unread: 1,
      },
      {
        key: users[1].user_id.toString(),
        keyRecipients: [users[1]],
        msgId: 4,
        unread: 2,
      },
      {
        key: users[2].user_id.toString(),
        keyRecipients: [users[2]],
        msgId: 3,
        unread: 1,
      },
    ]);
  });
});
