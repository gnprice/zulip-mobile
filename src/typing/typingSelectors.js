/* @flow strict-local */
import { createSelector } from 'reselect';

import type { Narrow, Selector, User } from '../types';
import { getTyping } from '../directSelectors';
import { isPrivateOrGroupNarrow } from '../utils/narrow';
import { pmEmailKeyStringFromKeyRecipients } from '../utils/recipient';
import { NULL_ARRAY, NULL_USER } from '../nullObjects';
import { getUsersById } from '../users/userSelectors';

export const getCurrentTypingUsers: Selector<$ReadOnlyArray<User>, Narrow> = createSelector(
  (state, narrow) => narrow,
  state => getTyping(state),
  state => getUsersById(state),
  (narrow, typing, usersById): User[] => {
    if (!isPrivateOrGroupNarrow(narrow)) {
      return NULL_ARRAY;
    }

    const recipients = narrow[0].operand.split(',').map(email => ({ email }));
    const normalizedRecipients = pmEmailKeyStringFromKeyRecipients(recipients);
    const currentTyping = typing[normalizedRecipients];

    if (!currentTyping || !currentTyping.userIds) {
      return NULL_ARRAY;
    }

    return currentTyping.userIds.map(userId => usersById.get(userId) || NULL_USER);
  },
);
