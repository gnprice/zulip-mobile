/* @flow strict-local */
import * as api from '../../api';
import type { Dispatch } from '../../reduxTypes';
import { reportPresence } from '../usersActions';
import * as eg from '../../__tests__/exampleData';

const setDateNow = timeMs => {
  // $FlowFixMe a Jest mock
  Date.now = jest.fn().mockReturnValue(timeMs);
};

const advanceDateNow = deltaMs => setDateNow(Date.now() + deltaMs);

jest.useFakeTimers();

describe('reportPresence', () => {
  beforeEach(() => {
    jest.runAllTimers();
    advanceDateNow(60 * 1000);
  });

  // $FlowFixMe a Jest mock
  api.reportPresence = jest.fn(() => {});

  const state = eg.reduxState();
  const sinkDispatch: Dispatch = (action => {}: $FlowFixMe);
  const tryReportPresence = hasFocus => reportPresence(hasFocus)(sinkDispatch, () => state);

  test('throttling', () => {
    tryReportPresence(false);
    // WORK HERE
  });
});
