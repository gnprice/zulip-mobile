/* @flow strict-local */
import deepFreeze from 'deep-freeze';

import {
  CANCEL_EDIT_MESSAGE,
  START_EDIT_MESSAGE,
  DEAD_QUEUE,
  LOGOUT,
  DO_NARROW,
  APP_ONLINE,
  APP_STATE,
  INITIAL_FETCH_COMPLETE,
  INIT_SAFE_AREA_INSETS,
  APP_ORIENTATION,
  GOT_PUSH_TOKEN,
  TOGGLE_OUTBOX_SENDING,
  DEBUG_FLAG_TOGGLE,
  INITIAL_FETCH_START,
} from '../../actionConstants';
import sessionReducer from '../sessionReducer';
import * as eg from '../../__tests__/exampleData';
import { privateNarrow } from '../../utils/narrow';

describe('sessionReducer', () => {
  const baseState = eg.baseReduxState.session;

  function expectReducer(prevState, action, expectedState) {
    expect(sessionReducer(deepFreeze(prevState), deepFreeze(action))).toEqual(expectedState);
  }

  function testReducer(prevState, action, expectedState) {
    test(`${action.type}`, () => {
      expectReducer(prevState, action, expectedState);
    });
  }

  testReducer(
    { ...baseState, lastNarrow: [], needsInitialFetch: false, loading: true },
    eg.action.account_switch,
    { ...baseState, lastNarrow: null, needsInitialFetch: true, loading: false },
  );

  testReducer(
    baseState,
    { type: START_EDIT_MESSAGE, messageId: 12, message: 'test', topic: 'test topic' },
    { ...baseState, editMessage: { id: 12, content: 'test', topic: 'test topic' } },
  );

  testReducer(
    { ...baseState, editMessage: { id: 12, content: 'test', topic: 'test topic' } },
    { type: CANCEL_EDIT_MESSAGE },
    baseState,
  );

  testReducer(baseState, eg.action.login_success, { ...baseState, needsInitialFetch: true });

  testReducer(
    { ...baseState, needsInitialFetch: false, loading: true },
    { type: DEAD_QUEUE },
    { ...baseState, needsInitialFetch: true, loading: false },
  );

  testReducer(
    { ...baseState, lastNarrow: [], needsInitialFetch: true, loading: true },
    { type: LOGOUT },
    { ...baseState, lastNarrow: null, needsInitialFetch: false, loading: false },
  );

  testReducer(
    baseState,
    { ...eg.action.realm_init, data: { ...eg.action.realm_init.data, queue_id: 100 } },
    { ...baseState, eventQueueId: 100 },
  );

  test('DO_NARROW', () => {
    const state = deepFreeze({ ...baseState, lastNarrow: [] });
    const action = deepFreeze({ type: DO_NARROW, narrow: privateNarrow('a@a.com') });
    const newState = sessionReducer(state, action);
    expect(newState).toEqual({ ...baseState, lastNarrow: privateNarrow('a@a.com') });
  });

  test('APP_ONLINE', () => {
    const state = deepFreeze({ ...baseState, isOnline: false });
    const action = deepFreeze({ type: APP_ONLINE, isOnline: true });
    const newState = sessionReducer(state, action);
    expect(newState).toEqual({ ...baseState, isOnline: true });
  });

  test('APP_STATE', () => {
    const state = deepFreeze({ ...baseState, isActive: false });
    const action = deepFreeze({ type: APP_STATE, isActive: true });
    const newState = sessionReducer(state, action);
    expect(newState).toEqual({ ...baseState, isActive: true });
  });

  test('INITIAL_FETCH_COMPLETE', () => {
    const state = deepFreeze({ ...baseState, needsInitialFetch: true, loading: true });
    const newState = sessionReducer(state, deepFreeze({ type: INITIAL_FETCH_COMPLETE }));
    expect(newState).toEqual({ ...baseState, needsInitialFetch: false, loading: false });
  });

  test('INITIAL_FETCH_START', () => {
    const state = deepFreeze({ ...baseState, loading: false });
    const newState = sessionReducer(state, deepFreeze({ type: INITIAL_FETCH_START }));
    expect(newState).toEqual({ ...baseState, loading: true });
  });

  test('INIT_SAFE_AREA_INSETS', () => {
    const safeAreaInsets = { top: 1, bottom: 2, right: 3, left: 0 };
    const action = deepFreeze({ type: INIT_SAFE_AREA_INSETS, safeAreaInsets });
    expect(sessionReducer(baseState, action)).toEqual({ ...baseState, safeAreaInsets });
  });

  test('APP_ORIENTATION', () => {
    const state = deepFreeze({ ...baseState, orientation: 'PORTRAIT' });
    const orientation = 'LANDSCAPE';
    const action = deepFreeze({ type: APP_ORIENTATION, orientation });
    expect(sessionReducer(state, action)).toEqual({ ...baseState, orientation });
  });

  test('GOT_PUSH_TOKEN', () => {
    const pushToken = 'pushToken';
    const action = deepFreeze({ type: GOT_PUSH_TOKEN, pushToken });
    expect(sessionReducer(baseState, action)).toEqual({ ...baseState, pushToken });
  });

  test('TOGGLE_OUTBOX_SENDING', () => {
    const state = deepFreeze({ ...baseState, outboxSending: false });
    expect(
      sessionReducer(state, deepFreeze({ type: TOGGLE_OUTBOX_SENDING, sending: true })),
    ).toEqual({ ...baseState, outboxSending: true });
  });

  test('DEBUG_FLAG_TOGGLE', () => {
    const action = deepFreeze({ type: DEBUG_FLAG_TOGGLE, key: 'someKey', value: true });
    expect(sessionReducer(baseState, action)).toEqual({
      ...baseState,
      debug: { doNotMarkMessagesAsRead: false, someKey: true },
    });
  });
});
