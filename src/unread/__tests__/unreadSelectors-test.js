// @flow strict-local
import { reducer } from '../unreadModel';
import {
  getUnreadByStream,
  getUnreadStreamTotal,
  getUnreadByPms,
  getUnreadPmsTotal,
  getUnreadByHuddles,
  getUnreadHuddlesTotal,
  getUnreadMentionsTotal,
  getUnreadTotal,
  getUnreadStreamsAndTopics,
  getUnreadStreamsAndTopicsSansMuted,
} from '../unreadSelectors';

import * as eg from '../../__tests__/lib/exampleData';
import { selectorBaseState as unreadState } from './unread-testlib';

// These stream IDs are shared with the data in `unreadState`.
const stream0 = { ...eg.makeStream(), stream_id: 0 };
const stream2 = { ...eg.makeStream(), stream_id: 2 };

const subscription0 = eg.makeSubscription({ stream: stream0 });
const subscription2 = eg.makeSubscription({ stream: stream2 });

describe('getUnreadByStream', () => {
  test('when no items in streams key, the result is an empty object', () => {
    const state = eg.reduxStatePlus({ subscriptions: [] });

    const unreadByStream = getUnreadByStream(state);

    expect(unreadByStream).toEqual({});
  });

  test('when there are unread stream messages, returns their counts', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [subscription0, subscription2],
      unread: unreadState,
      mute: [[stream0.name, 'a topic']],
    });

    const unreadByStream = getUnreadByStream(state);

    expect(unreadByStream).toEqual({ '0': 2, '2': 2 });
  });
});

describe('getUnreadStreamTotal', () => {
  test('when no items in "streams" key, there are unread message', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [],
    });

    const unreadCount = getUnreadStreamTotal(state);

    expect(unreadCount).toEqual(0);
  });

  test('count all the unread messages listed in "streams" key', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
      subscriptions: [subscription0, subscription2],
    });

    const unreadCount = getUnreadStreamTotal(state);

    expect(unreadCount).toEqual(7);
  });
});

describe('getUnreadByPms', () => {
  test('when no items in streams key, the result is an empty array', () => {
    const state = eg.reduxStatePlus({});

    const unreadByStream = getUnreadByPms(state);

    expect(unreadByStream).toEqual({});
  });

  test('when there are unread private messages, returns counts by sender_id', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });

    const unreadByStream = getUnreadByPms(state);

    expect(unreadByStream).toEqual({ '0': 2, '2': 3 });
  });
});

describe('getUnreadPmsTotal', () => {
  test('when no items in "pms" key, there are unread private messages', () => {
    const state = eg.reduxStatePlus({});

    const unreadCount = getUnreadPmsTotal(state);

    expect(unreadCount).toEqual(0);
  });

  test('when there are keys in "pms", sum up all unread private message counts', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });

    const unreadCount = getUnreadPmsTotal(state);

    expect(unreadCount).toEqual(5);
  });
});

describe('getUnreadByHuddles', () => {
  test('when no items in streams key, the result is an empty array', () => {
    const state = eg.reduxStatePlus({});

    const unreadByStream = getUnreadByHuddles(state);

    expect(unreadByStream).toEqual({});
  });

  test('when there are unread stream messages, returns a ', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });

    const unreadByStream = getUnreadByHuddles(state);

    expect(unreadByStream).toEqual({ '1,2,3': 2, '1,4,5': 3 });
  });
});

describe('getUnreadHuddlesTotal', () => {
  test('when no items in "huddles" key, there are unread group messages', () => {
    const state = eg.reduxStatePlus({});

    const unreadCount = getUnreadHuddlesTotal(state);

    expect(unreadCount).toEqual(0);
  });

  test('when there are keys in "huddles", sum up all unread group message counts', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });

    const unreadCount = getUnreadHuddlesTotal(state);

    expect(unreadCount).toEqual(5);
  });
});

describe('getUnreadMentionsTotal', () => {
  test('unread mentions count is equal to the unread array length', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });

    const unreadCount = getUnreadMentionsTotal(state);

    expect(unreadCount).toEqual(3);
  });
});

describe('getUnreadTotal', () => {
  test('if no key has any items then no unread messages', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [],
    });

    const unreadCount = getUnreadTotal(state);

    expect(unreadCount).toEqual(0);
  });

  test('calculates total unread of streams + pms + huddles', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
      subscriptions: [subscription0, subscription2],
    });

    const unreadCount = getUnreadTotal(state);

    expect(unreadCount).toEqual(20);
  });
});

describe('getUnreadStreamsAndTopics', () => {
  test('if no key has any items then no unread messages', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [],
    });

    const unreadCount = getUnreadStreamsAndTopics(state);

    expect(unreadCount).toEqual([]);
  });

  test('muted streams are included', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [
        { ...subscription0, in_home_view: false, name: 'stream 0' },
        { ...subscription2, in_home_view: false, name: 'stream 2' },
      ],
      unread: unreadState,
    });

    const unreadCount = getUnreadStreamsAndTopics(state);

    expect(unreadCount).toMatchObject([
      {
        data: [
          {
            isMuted: false,
            key: 'another topic',
            lastUnreadMsgId: 5,
            topic: 'another topic',
            unread: 2,
          },
          {
            isMuted: false,
            key: 'a topic',
            lastUnreadMsgId: 3,
            topic: 'a topic',
            unread: 3,
          },
        ],
        key: 'stream:stream 0',
        subscription: { stream_id: subscription0.stream_id },
        unread: 5,
      },
      {
        data: [
          {
            isMuted: false,
            key: 'some other topic',
            lastUnreadMsgId: 7,
            topic: 'some other topic',
            unread: 2,
          },
        ],
        key: 'stream:stream 2',
        subscription: { stream_id: subscription2.stream_id },
        unread: 2,
      },
    ]);
  });

  test('muted topics inside non muted streams are included', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [
        { ...subscription0, name: 'stream 0' },
        { ...subscription2, name: 'stream 2' },
      ],
      unread: unreadState,
      mute: [['stream 0', 'a topic']],
    });

    const unreadCount = getUnreadStreamsAndTopics(state);

    expect(unreadCount).toMatchObject([
      {
        data: [
          {
            isMuted: false,
            key: 'another topic',
            topic: 'another topic',
            unread: 2,
            lastUnreadMsgId: 5,
          },
          {
            isMuted: true,
            key: 'a topic',
            topic: 'a topic',
            unread: 3,
            lastUnreadMsgId: 3,
          },
        ],
        key: 'stream:stream 0',
        subscription: { stream_id: subscription0.stream_id },
        unread: 2,
      },
      {
        data: [
          {
            isMuted: false,
            key: 'some other topic',
            lastUnreadMsgId: 7,
            topic: 'some other topic',
            unread: 2,
          },
        ],
        key: 'stream:stream 2',
        subscription: { stream_id: subscription2.stream_id },
        unread: 2,
      },
    ]);
  });

  test('group data by stream and topics inside, count unread', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [
        { ...subscription0, name: 'stream 0' },
        { ...subscription2, name: 'stream 2' },
      ],
      unread: unreadState,
    });

    const unreadCount = getUnreadStreamsAndTopics(state);

    expect(unreadCount).toMatchObject([
      {
        key: 'stream:stream 0',
        subscription: { stream_id: subscription0.stream_id },
        unread: 5,
        data: [
          {
            key: 'another topic',
            topic: 'another topic',
            unread: 2,
            isMuted: false,
            lastUnreadMsgId: 5,
          },
          { key: 'a topic', topic: 'a topic', unread: 3, isMuted: false, lastUnreadMsgId: 3 },
        ],
      },
      {
        key: 'stream:stream 2',
        subscription: { stream_id: subscription2.stream_id },
        unread: 2,
        data: [
          {
            key: 'some other topic',
            topic: 'some other topic',
            unread: 2,
            isMuted: false,
            lastUnreadMsgId: 7,
          },
        ],
      },
    ]);
  });

  test('streams are sorted alphabetically, case-insensitive, topics by last activity, pinned stream on top', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [
        {
          ...eg.makeSubscription(),
          stream_id: 2,
          color: 'green',
          name: 'def stream',
          in_home_view: true,
          invite_only: false,
          pin_to_top: false,
        },
        {
          ...eg.makeSubscription(),
          stream_id: 1,
          color: 'blue',
          name: 'xyz stream',
          in_home_view: true,
          invite_only: false,
          pin_to_top: true,
        },
        {
          ...eg.makeSubscription(),
          stream_id: 0,
          color: 'red',
          name: 'abc stream',
          in_home_view: true,
          invite_only: false,
          pin_to_top: false,
        },
      ],
      unread: [
        eg.streamMessage({ stream_id: 0, subject: 'z topic', id: 1 }),
        eg.streamMessage({ stream_id: 0, subject: 'z topic', id: 2 }),
        eg.streamMessage({ stream_id: 0, subject: 'z topic', id: 3 }),
        eg.streamMessage({ stream_id: 0, subject: 'a topic', id: 4 }),
        eg.streamMessage({ stream_id: 0, subject: 'a topic', id: 5 }),
        eg.streamMessage({ stream_id: 2, subject: 'b topic', id: 6 }),
        eg.streamMessage({ stream_id: 2, subject: 'b topic', id: 7 }),
        eg.streamMessage({ stream_id: 2, subject: 'c topic', id: 7 }),
        eg.streamMessage({ stream_id: 2, subject: 'c topic', id: 8 }),
        eg.streamMessage({ stream_id: 1, subject: 'e topic', id: 10 }),
        eg.streamMessage({ stream_id: 1, subject: 'd topic', id: 9 }),
      ].reduce(
        (st, message) => reducer(st, eg.mkActionEventNewMessage(message), eg.plusReduxState),
        eg.plusReduxState.unread,
      ),
      mute: [['def stream', 'c topic']],
    });

    const unreadCount = getUnreadStreamsAndTopics(state);

    expect(unreadCount).toMatchObject([
      {
        key: 'stream:xyz stream',
        subscription: { name: 'xyz stream' },
        unread: 2,
        data: [
          { key: 'e topic', topic: 'e topic', unread: 1, isMuted: false, lastUnreadMsgId: 10 },
          { key: 'd topic', topic: 'd topic', unread: 1, isMuted: false, lastUnreadMsgId: 9 },
        ],
      },
      {
        key: 'stream:abc stream',
        subscription: { name: 'abc stream' },
        unread: 5,
        data: [
          { key: 'a topic', topic: 'a topic', unread: 2, isMuted: false, lastUnreadMsgId: 5 },
          { key: 'z topic', topic: 'z topic', unread: 3, isMuted: false, lastUnreadMsgId: 3 },
        ],
      },
      {
        key: 'stream:def stream',
        subscription: { name: 'def stream' },
        unread: 2,
        data: [
          { key: 'c topic', topic: 'c topic', unread: 2, isMuted: true, lastUnreadMsgId: 8 },
          { key: 'b topic', topic: 'b topic', unread: 2, isMuted: false, lastUnreadMsgId: 7 },
        ],
      },
    ]);
  });
});

describe('getUnreadStreamsAndTopicsSansMuted', () => {
  test('muted streams are not included', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [
        { ...subscription0, in_home_view: false },
        { ...subscription2, in_home_view: false },
      ],
      unread: unreadState,
    });

    const unreadCount = getUnreadStreamsAndTopicsSansMuted(state);

    expect(unreadCount).toEqual([]);
  });

  test('muted topics inside non muted streams are not included', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [{ ...subscription0, name: 'stream 0' }],
      unread: unreadState,
      mute: [['stream 0', 'a topic']],
    });

    const unreadCount = getUnreadStreamsAndTopicsSansMuted(state);

    expect(unreadCount).toMatchObject([
      {
        data: [
          {
            isMuted: false,
            key: 'another topic',
            topic: 'another topic',
            unread: 2,
            lastUnreadMsgId: 5,
          },
        ],
        key: 'stream:stream 0',
        subscription: { stream_id: subscription0.stream_id },
        unread: 2,
      },
    ]);
  });
});
