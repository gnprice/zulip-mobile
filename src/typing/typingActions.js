/* @flow strict-local */
import type { Action, Dispatch, GetState } from '../types';

import { getTyping } from '../directSelectors';

export const clearTyping = (outdatedNotifications: string[]): Action => ({
  type: 'CLEAR_TYPING',
  outdatedNotifications,
});

function typingStatusExpiryLoop(dispatch: Dispatch, getState: GetState) {
  const currentTime = new Date().getTime();
  const typing = getTyping(getState());
  if (Object.keys(typing).length === 0) {
    // No longer anything to do or to wait for.
    return;
  }
  const outdatedNotifications = [];
  Object.keys(typing).forEach(recipients => {
    if (currentTime - typing[recipients].time >= 15000) {
      outdatedNotifications.push(recipients);
    }
  });
  dispatch(clearTyping(outdatedNotifications));
  setTimeout(typingStatusExpiryLoop, 15000, dispatch, getState);
}

/** Start the typing-status expiry loop, if there isn't one already. */
export const ensureTypingStatusExpiryLoop = () => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const state = getState();
  if (Object.keys(state.typing).length === 0) {
    typingStatusExpiryLoop(dispatch, getState);
  }
};
