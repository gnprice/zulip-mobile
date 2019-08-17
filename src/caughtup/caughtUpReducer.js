/* @flow strict-local */
import type { CaughtUpState, Action } from '../types';
import { NULL_OBJECT } from '../nullObjects';

const initialState: CaughtUpState = NULL_OBJECT;

export default (state: CaughtUpState = initialState, action: Action): CaughtUpState => {
    return state;
};
