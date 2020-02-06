/* @flow strict-local */
import type { Narrow, Dispatch, GetState } from '../types';
import { getAuth, getUsersById } from '../selectors';
import { getMessageIdFromLink, getNarrowFromLink } from '../utils/internalLinks';
import openLink from '../utils/openLink';
import { navigateToChat } from '../nav/navActions';
import { FIRST_UNREAD_ANCHOR } from '../anchor';
import { getStreamsById } from '../subscriptions/subscriptionSelectors';
import * as api from '../api';
import { isUrlOnRealm } from '../utils/url';
import { type DualNarrow, asApiStringNarrow } from '../utils/narrow';

/**
 * Navigate to the given narrow.
 */
export const doNarrow = (narrow: Narrow | DualNarrow<>, anchor: number = FIRST_UNREAD_ANCHOR) => (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const stringsNarrow = asApiStringNarrow(narrow);

  // TODO: Use `anchor` to open the message list to a particular message.
  dispatch(navigateToChat(stringsNarrow));
};

export const messageLinkPress = (href: string) => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  const state = getState();
  const auth = getAuth(state);
  const usersById = getUsersById(state);
  const streamsById = getStreamsById(state);
  const narrow = getNarrowFromLink(href, auth.realm, usersById, streamsById);
  if (narrow) {
    const anchor = getMessageIdFromLink(href, auth.realm);
    dispatch(doNarrow(narrow, anchor));
  } else if (!isUrlOnRealm(href, auth.realm)) {
    openLink(href);
  } else {
    const url =
      (await api.tryGetFileTemporaryUrl(href, auth)) ?? new URL(href, auth.realm).toString();
    openLink(url);
  }
};
