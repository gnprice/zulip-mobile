/* @flow strict-local */
import { createSelector } from 'reselect';

import type { Selector, UserId, UserPresence } from '../types';
import { getRawPresence } from '../directSelectors';
import { getAllUsersByEmail } from '../users/userSelectors';

// Convert keys from email to ID.
// If not found, just drop the entry.
export const getPresence: Selector<Map<UserId, UserPresence>> = createSelector(
  getRawPresence,
  getAllUsersByEmail,
  (rawPresence, allUsersByEmail) =>
    new Map(
      Object.keys(rawPresence)
        .map(email => {
          const user = allUsersByEmail.get(email);
          if (!user) {
            return null;
          }
          return [user.user_id, rawPresence[email]];
        })
        .filter(Boolean),
    ),
);
