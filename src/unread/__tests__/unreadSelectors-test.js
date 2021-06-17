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
    expect(getUnreadByStream(state)).toEqual({});
  });

  test('when there are unread stream messages, returns their counts', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [subscription0, subscription2],
      unread: unreadState,
      mute: [[stream0.name, 'a topic']],
    });
    expect(getUnreadByStream(state)).toEqual({ '0': 2, '2': 2 });
  });
});

describe('getUnreadStreamTotal', () => {
  test('when no items in "streams" key, there are unread message', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [],
    });
    expect(getUnreadStreamTotal(state)).toEqual(0);
  });

  test('count all the unread messages listed in "streams" key', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
      subscriptions: [subscription0, subscription2],
    });
    expect(getUnreadStreamTotal(state)).toEqual(7);
  });
});

describe('getUnreadByPms', () => {
  test('when no items in streams key, the result is an empty array', () => {
    const state = eg.reduxStatePlus({});
    expect(getUnreadByPms(state)).toEqual({});
  });

  test('when there are unread private messages, returns counts by sender_id', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });
    expect(getUnreadByPms(state)).toEqual({ '0': 2, '2': 3 });
  });
});

describe('getUnreadPmsTotal', () => {
  test('when no items in "pms" key, there are unread private messages', () => {
    const state = eg.reduxStatePlus({});
    expect(getUnreadPmsTotal(state)).toEqual(0);
  });

  test('when there are keys in "pms", sum up all unread private message counts', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });
    expect(getUnreadPmsTotal(state)).toEqual(5);
  });
});

describe('getUnreadByHuddles', () => {
  test('when no items in streams key, the result is an empty array', () => {
    const state = eg.reduxStatePlus({});
    expect(getUnreadByHuddles(state)).toEqual({});
  });

  test('when there are unread stream messages, returns a ', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });
    expect(getUnreadByHuddles(state)).toEqual({ '1,2,3': 2, '1,4,5': 3 });
  });
});

describe('getUnreadHuddlesTotal', () => {
  test('when no items in "huddles" key, there are unread group messages', () => {
    const state = eg.reduxStatePlus({});
    expect(getUnreadHuddlesTotal(state)).toEqual(0);
  });

  test('when there are keys in "huddles", sum up all unread group message counts', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });
    expect(getUnreadHuddlesTotal(state)).toEqual(5);
  });
});

describe('getUnreadMentionsTotal', () => {
  test('unread mentions count is equal to the unread array length', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
    });
    expect(getUnreadMentionsTotal(state)).toEqual(3);
  });
});

describe('getUnreadTotal', () => {
  test('if no key has any items then no unread messages', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [],
    });
    expect(getUnreadTotal(state)).toEqual(0);
  });

  test('calculates total unread of streams + pms + huddles', () => {
    const state = eg.reduxStatePlus({
      unread: unreadState,
      subscriptions: [subscription0, subscription2],
    });
    expect(getUnreadTotal(state)).toEqual(20);
  });
});

describe('getUnreadStreamsAndTopics', () => {
  test('if no key has any items then no unread messages', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [],
    });
    expect(getUnreadStreamsAndTopics(state)).toEqual([]);
  });

  test('muted streams are not included', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [
        { ...subscription0, in_home_view: false },
        { ...subscription2, in_home_view: false },
      ],
      unread: unreadState,
    });
    expect(getUnreadStreamsAndTopics(state)).toEqual([]);
  });

  test('muted topics inside non muted streams are not included', () => {
    const state = eg.reduxStatePlus({
      subscriptions: [{ ...subscription0, name: 'stream 0' }],
      unread: unreadState,
      mute: [['stream 0', 'a topic']],
    });
    expect(getUnreadStreamsAndTopics(state)).toMatchObject([
      {
        topics: [
          {
            key: 'another topic',
            topicName: 'another topic',
            unreadCount: 2,
            lastUnreadMsgId: 5,
          },
        ],
        key: 'stream:stream 0',
        subscription: { stream_id: subscription0.stream_id },
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
    expect(getUnreadStreamsAndTopics(state)).toMatchObject([
      {
        key: 'stream:stream 0',
        subscription: { stream_id: subscription0.stream_id },
        unread: 5,
        topics: [
          {
            key: 'another topic',
            topicName: 'another topic',
            unreadCount: 2,
            lastUnreadMsgId: 5,
          },
          { key: 'a topic', topicName: 'a topic', unreadCount: 3, lastUnreadMsgId: 3 },
        ],
      },
      {
        key: 'stream:stream 2',
        subscription: { stream_id: subscription2.stream_id },
        unread: 2,
        topics: [
          {
            key: 'some other topic',
            topicName: 'some other topic',
            unreadCount: 2,
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
    expect(getUnreadStreamsAndTopics(state)).toMatchObject([
      {
        key: 'stream:xyz stream',
        subscription: { name: 'xyz stream' },
        unread: 2,
        topics: [
          { key: 'e topic', topicName: 'e topic', unreadCount: 1, lastUnreadMsgId: 10 },
          { key: 'd topic', topicName: 'd topic', unreadCount: 1, lastUnreadMsgId: 9 },
        ],
      },
      {
        key: 'stream:abc stream',
        subscription: { name: 'abc stream' },
        unread: 5,
        topics: [
          { key: 'a topic', topicName: 'a topic', unreadCount: 2, lastUnreadMsgId: 5 },
          { key: 'z topic', topicName: 'z topic', unreadCount: 3, lastUnreadMsgId: 3 },
        ],
      },
      {
        key: 'stream:def stream',
        subscription: { name: 'def stream' },
        unread: 2,
        topics: [{ key: 'b topic', topicName: 'b topic', unreadCount: 2, lastUnreadMsgId: 7 }],
      },
    ]);
  });
});
