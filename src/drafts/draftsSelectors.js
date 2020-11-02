/* @flow strict-local */
import { keyFromNarrow } from '../utils/narrow';
import type { Narrow, GlobalState } from '../types';

export const getDraftForNarrow = (state: GlobalState, narrow: Narrow): string =>
  state.drafts[keyFromNarrow(narrow)] || '';
