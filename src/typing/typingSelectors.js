/* @flow strict-local */
import { createSelector } from 'reselect';

import type { Narrow, Selector, UserOrBot } from '../types';
import { getTyping } from '../directSelectors';
import { caseNarrowPartial, isPmNarrow } from '../utils/narrow';
import { normalizeRecipientsAsUserIds } from '../utils/recipient';
import { NULL_ARRAY, NULL_USER } from '../nullObjects';
import { getAllUsersById, getAllUsersByEmail } from '../users/userSelectors';
import { maybeGetAll } from '../maybe';

export const getCurrentTypingUsers: Selector<$ReadOnlyArray<UserOrBot>, Narrow> = createSelector(
  (state, narrow) => narrow,
  state => getTyping(state),
  state => getAllUsersById(state),
  state => getAllUsersByEmail(state),
  (narrow, typing, allUsersById, allUsersByEmail): UserOrBot[] => {
    if (!isPmNarrow(narrow)) {
      return NULL_ARRAY;
    }

    /* eslint-disable-next-line no-shadow */
    const emails = caseNarrowPartial(narrow, { pm: emails => emails });
    const recipients = maybeGetAll(allUsersByEmail, emails)?.map(u => u.user_id);
    if (!recipients) {
      throw new Error('Narrow contains email that does not map to any user.');
    }
    const normalizedRecipients = normalizeRecipientsAsUserIds(recipients);
    const currentTyping = typing[normalizedRecipients];

    if (!currentTyping || !currentTyping.userIds) {
      return NULL_ARRAY;
    }

    return currentTyping.userIds.map(userId => allUsersById.get(userId) || NULL_USER);
  },
);
