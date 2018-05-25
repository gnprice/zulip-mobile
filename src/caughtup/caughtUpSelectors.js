/* @flow */
import { createSelector } from 'reselect';

import type { CaughtUpState, GlobalState, Narrow } from '../types';
import { NULL_CAUGHTUP, NULL_OBJECT } from '../nullObjects';

export const getCaughtUp = (state: GlobalState): CaughtUpState =>
  state.caughtUp || NULL_OBJECT;

export const getCaughtUpForActiveNarrow = (narrow: Narrow) =>
  createSelector(
    getCaughtUp,
    caughtUp => caughtUp[JSON.stringify(narrow)] || NULL_CAUGHTUP,
  );
