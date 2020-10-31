/* @flow strict-local */
import type { Fetching, GlobalState } from '../types';
import { getFetching } from '../directSelectors';
import { DualNarrow } from '../utils/narrow';

/** The value implicitly represented by a missing entry in FetchingState. */
export const DEFAULT_FETCHING = { older: false, newer: false };

export const getFetchingForNarrow = (state: GlobalState, narrow: DualNarrow<>): Fetching =>
  getFetching(state)[JSON.stringify(narrow.strings)] || DEFAULT_FETCHING;
