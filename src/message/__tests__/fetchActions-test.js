import mockStore from 'redux-mock-store'; // eslint-disable-line

import { fetchMessages, fetchOlder, fetchNewer } from '../fetchActions';
import { streamNarrow, HOME_NARROW, HOME_NARROW_STR } from '../../utils/narrow';
import { navStateWithNarrow } from '../../utils/testHelpers';

const narrow = streamNarrow('some stream');
const streamNarrowStr = JSON.stringify(narrow);

global.FormData = class FormData {};

describe('fetchActions', () => {
  afterEach(() => {
    fetch.reset();
  });

  describe('fetchMessages', () => {
    test('message fetch success action is dispatched after successful fetch', async () => {
      const store = mockStore({
        ...navStateWithNarrow(HOME_NARROW),
        accounts: [
          {
            realm: 'https://example.com',
          },
        ],
        narrows: {
          [streamNarrowStr]: [{ id: 1 }],
        },
      });
      const response = { messages: [{ id: 1 }, { id: 2 }, { id: 3 }], result: 'success' };
      fetch.mockResponseSuccess(JSON.stringify(response));

      await store.dispatch(fetchMessages(HOME_NARROW, 0, 1, 1, true));
      const actions = store.getActions();

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('MESSAGE_FETCH_START');
      expect(actions[1].type).toBe('MESSAGE_FETCH_COMPLETE');
    });

    test('when messages to be fetched both before and after anchor, fetchingOlder and fetchingNewer is true', async () => {
      const store = mockStore({
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [{ id: 1 }],
        },
      });

      fetch.mockResponseSuccess(JSON.stringify({ result: 'success' }));
      await store.dispatch(fetchMessages(HOME_NARROW, 0, 1, 1, true));
      const actions = store.getActions();

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('MESSAGE_FETCH_START');
    });

    test('when no messages to be fetched before the anchor, fetchingOlder is false', async () => {
      const store = mockStore({
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [{ id: 1 }],
        },
      });

      fetch.mockResponseSuccess(JSON.stringify({ result: 'success' }));
      await store.dispatch(fetchMessages(HOME_NARROW, 0, -1, 1, true));
      const actions = store.getActions();

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('MESSAGE_FETCH_START');
    });

    test('when no messages to be fetched after the anchor, fetchingNewer is false', async () => {
      const store = mockStore({
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [{ id: 1 }],
        },
      });

      fetch.mockResponseSuccess(JSON.stringify({ result: 'success' }));
      await store.dispatch(fetchMessages(HOME_NARROW, 0, 1, -1, true));
      const actions = store.getActions();

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('MESSAGE_FETCH_START');
    });
  });

  describe('fetchOlder', () => {
    test('message fetch start action is dispatched with fetchingOlder true', async () => {
      const store = mockStore({
        session: {
          needsInitialFetch: false,
        },
        caughtUp: {
          [HOME_NARROW_STR]: { older: false },
        },
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [2],
          [HOME_NARROW_STR]: [1, 2],
        },
        messages: {
          1: { id: 1 },
          2: { id: 2 },
        },
        fetching: {
          [HOME_NARROW_STR]: { older: false, newer: false },
        },
      });

      fetch.mockResponseSuccess(JSON.stringify({}));
      await store.dispatch(fetchOlder(HOME_NARROW));
      const actions = store.getActions();

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('MESSAGE_FETCH_START');
    });

    test('when caughtUp older is true, no action is dispatched', async () => {
      const store = mockStore({
        session: {
          needsInitialFetch: false,
        },
        caughtUp: {
          [HOME_NARROW_STR]: { older: true },
        },
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [2],
          [HOME_NARROW_STR]: [1, 2],
        },
        messages: {
          1: { id: 1 },
          2: { id: 2 },
        },
        fetching: {
          [HOME_NARROW_STR]: { older: false, newer: false },
        },
      });

      fetch.mockResponseSuccess(JSON.stringify({}));
      await store.dispatch(fetchOlder(HOME_NARROW));
      const actions = store.getActions();

      expect(actions).toHaveLength(0);
    });

    test('when fetchingOlder older is true, no action is dispatched', async () => {
      const store = mockStore({
        session: {
          needsInitialFetch: false,
        },
        caughtUp: {
          [HOME_NARROW_STR]: { older: false },
        },
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [2],
          [HOME_NARROW_STR]: [1, 2],
        },
        messages: {
          1: { id: 1 },
          2: { id: 2 },
        },
        fetching: {
          [HOME_NARROW_STR]: { older: true, newer: false },
        },
      });

      fetch.mockResponseSuccess(JSON.stringify({}));
      await store.dispatch(fetchOlder(HOME_NARROW));
      const actions = store.getActions();

      expect(actions).toHaveLength(0);
    });

    test('when needsInitialFetch is true, no action is dispatched', async () => {
      const store = mockStore({
        session: {
          needsInitialFetch: true,
        },
        caughtUp: {
          [HOME_NARROW_STR]: { older: false },
        },
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [2],
          [HOME_NARROW_STR]: [1, 2],
        },
        messages: {
          1: { id: 1 },
          2: { id: 2 },
        },
        fetching: {},
      });

      fetch.mockResponseSuccess(JSON.stringify({}));
      await store.dispatch(fetchOlder(HOME_NARROW));
      const actions = store.getActions();

      expect(actions).toHaveLength(0);
    });
  });

  describe('fetchNewer', () => {
    test('message fetch start action is dispatched with fetchingNewer true', async () => {
      const store = mockStore({
        session: {
          needsInitialFetch: false,
        },
        caughtUp: {
          [HOME_NARROW_STR]: { newer: false },
        },
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [2],
          [HOME_NARROW_STR]: [1, 2],
        },
        messages: {
          1: { id: 1 },
          2: { id: 2 },
        },
        fetching: {},
      });

      fetch.mockResponseSuccess(JSON.stringify({}));
      await store.dispatch(fetchNewer(HOME_NARROW));
      const actions = store.getActions();

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('MESSAGE_FETCH_START');
    });

    test('when caughtUp newer is true, no action is dispatched', async () => {
      const store = mockStore({
        session: {
          needsInitialFetch: false,
        },
        caughtUp: {
          [HOME_NARROW_STR]: { newer: true },
        },
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [2],
          [HOME_NARROW_STR]: [1, 2],
        },
        messages: {
          1: { id: 1 },
          2: { id: 2 },
        },
        fetching: {},
      });

      fetch.mockResponseSuccess(JSON.stringify({}));
      await store.dispatch(fetchNewer(HOME_NARROW));
      const actions = store.getActions();

      expect(actions).toHaveLength(0);
    });

    test('when fetching.newer is true, no action is dispatched', async () => {
      const store = mockStore({
        session: {
          needsInitialFetch: false,
        },
        caughtUp: {
          [HOME_NARROW_STR]: { newer: false },
        },
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [2],
          [HOME_NARROW_STR]: [1, 2],
        },
        messages: {
          1: { id: 1 },
          2: { id: 2 },
        },
        fetching: {
          HOME_NARROW: { older: false, newer: true },
        },
      });

      fetch.mockResponseSuccess(JSON.stringify({}));
      await store.dispatch(fetchNewer(HOME_NARROW));
      const actions = store.getActions();

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('MESSAGE_FETCH_START');
    });

    test('when needsInitialFetch is true, no action is dispatched', async () => {
      const store = mockStore({
        session: {
          needsInitialFetch: true,
        },
        caughtUp: {
          [HOME_NARROW_STR]: { newer: false },
        },
        fetching: {},
        ...navStateWithNarrow(HOME_NARROW),
        narrows: {
          [streamNarrowStr]: [2],
          [HOME_NARROW_STR]: [1, 2],
        },
        messages: {
          1: { id: 1 },
          2: { id: 2 },
        },
      });

      fetch.mockResponseSuccess(JSON.stringify({}));
      await store.dispatch(fetchNewer(HOME_NARROW));
      const actions = store.getActions();

      expect(actions).toHaveLength(0);
    });
  });
});
