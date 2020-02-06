/* @flow strict-local */
import type { Dispatch, GetState } from '../types';
import { getAuth, getUsersById, isNarrowValid, getIsHydrated } from '../selectors';
import { DO_NARROW } from '../actionConstants';
import { getFullUrl } from '../utils/url';
import { getMessageIdFromLink, getNarrowFromLink } from '../utils/internalLinks';
import openLink from '../utils/openLink';
import { fetchMessagesInNarrow } from './fetchActions';
import { navigateToChat } from '../nav/navActions';
import { FIRST_UNREAD_ANCHOR } from '../constants';
import { getStreamsById } from '../subscriptions/subscriptionSelectors';
import * as logging from '../utils/logging';
import { type NarrowBridge, asApiStringNarrow } from '../utils/narrow';

/**
 * Navigate to the given narrow, while fetching any data needed.
 *
 * Also does other things we should always do when navigating to a narrow.
 *
 * If the narrow is invalid or narrowing is impossible, silently does nothing.
 *
 * See `MessagesState` for background about the fetching, including why this
 * is nearly the only navigation in the app where additional data fetching
 * is required.  See `fetchMessagesInNarrow` for more details.
 */
export const doNarrow = (narrow: NarrowBridge, anchor: number = FIRST_UNREAD_ANCHOR) => (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const state = getState();

  if (!getIsHydrated(state)) {
    // It should be impossible to get here before rehydrating; that's what
    // we use `redux-action-buffer` for.
    logging.warn('doNarrow: skipped because not yet hydrated');
    return;
  }

  const stringsNarrow = asApiStringNarrow(narrow);

  if (!isNarrowValid(stringsNarrow)(state)) {
    // If this condition happens, the user will experience it as a bug.
    logging.warn('doNarrow: skipped because missing data for narrow', { narrow });
    return;
  }

  dispatch({ type: DO_NARROW, narrow: stringsNarrow });
  dispatch(fetchMessagesInNarrow(stringsNarrow, anchor));
  dispatch(navigateToChat(stringsNarrow));
};

export const messageLinkPress = (href: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const auth = getAuth(state);
  const usersById = getUsersById(state);
  const streamsById = getStreamsById(state);
  const narrow = getNarrowFromLink(href, auth.realm, usersById, streamsById);
  if (narrow) {
    const anchor = getMessageIdFromLink(href, auth.realm);
    dispatch(doNarrow(narrow, anchor));
    return;
  }
  openLink(getFullUrl(href, auth.realm));
};
