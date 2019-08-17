/* @flow strict-local */
import type { FetchingState, Action } from '../types';
import { NULL_OBJECT } from '../nullObjects';

const initialState: FetchingState = NULL_OBJECT;

export default (state: FetchingState = initialState, action: Action): FetchingState => {
    return state;
};
