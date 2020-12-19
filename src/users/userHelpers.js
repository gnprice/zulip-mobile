/* @flow strict-local */
import uniqby from 'lodash.uniqby';

import type { UserPresence, User, UserId, UserGroup, PresenceState, UserOrBot } from '../types';
import { ensureUnreachable } from '../types';
import { statusFromPresence } from '../utils/presence';
import { makeUserId } from '../api/idTypes';

type UsersByStatus = {|
  active: UserOrBot[],
  idle: UserOrBot[],
  offline: UserOrBot[],
  unavailable: UserOrBot[],
|};

export const groupUsersByStatus = (users: UserOrBot[], presences: PresenceState): UsersByStatus => {
  const groupedUsers = { active: [], idle: [], offline: [], unavailable: [] };
  users.forEach(user => {
    const status = statusFromPresence(presences[user.user_id]);
    groupedUsers[status].push(user);
  });
  return groupedUsers;
};

const statusOrder = (presence: UserPresence): number => {
  const status = statusFromPresence(presence);
  switch (status) {
    case 'active':
      return 1;
    case 'idle':
      return 2;
    case 'offline':
      return 3;
    default:
      ensureUnreachable(status);
      return 4;
  }
};

export const sortUserList = (users: UserOrBot[], presences: PresenceState): UserOrBot[] =>
  [...users].sort(
    (x1, x2) =>
      statusOrder(presences[x1.user_id]) - statusOrder(presences[x2.user_id])
      || x1.full_name.toLowerCase().localeCompare(x2.full_name.toLowerCase()),
  );

export type AutocompleteOption = { user_id: UserId, email: string, full_name: string, ... };

export const filterUserList = (
  users: $ReadOnlyArray<UserOrBot>,
  filter: string = '',
  ownUserId: ?UserId,
): UserOrBot[] =>
  users.filter(
    user =>
      user.user_id !== ownUserId
      && (filter === ''
        || user.full_name.toLowerCase().includes(filter.toLowerCase())
        || user.email.toLowerCase().includes(filter.toLowerCase())),
  );

export const sortAlphabetically = (users: User[]): User[] =>
  [...users].sort((x1, x2) => x1.full_name.toLowerCase().localeCompare(x2.full_name.toLowerCase()));

export const filterUserStartWith = (
  users: $ReadOnlyArray<AutocompleteOption>,
  filter: string = '',
  ownUserId: UserId,
): $ReadOnlyArray<AutocompleteOption> =>
  users.filter(
    user =>
      user.user_id !== ownUserId && user.full_name.toLowerCase().startsWith(filter.toLowerCase()),
  );

export const filterUserByInitials = (
  users: $ReadOnlyArray<AutocompleteOption>,
  filter: string = '',
  ownUserId: UserId,
): $ReadOnlyArray<AutocompleteOption> =>
  users.filter(
    user =>
      user.user_id !== ownUserId
      && user.full_name
        .replace(/(\s|[a-z])/g, '')
        .toLowerCase()
        .startsWith(filter.toLowerCase()),
  );

export const filterUserThatContains = (
  users: $ReadOnlyArray<AutocompleteOption>,
  filter: string = '',
  ownUserId: UserId,
): $ReadOnlyArray<AutocompleteOption> =>
  users.filter(
    user =>
      user.user_id !== ownUserId && user.full_name.toLowerCase().includes(filter.toLowerCase()),
  );

export const filterUserMatchesEmail = (
  users: $ReadOnlyArray<AutocompleteOption>,
  filter: string = '',
  ownUserId: UserId,
): $ReadOnlyArray<AutocompleteOption> =>
  users.filter(
    user => user.user_id !== ownUserId && user.email.toLowerCase().includes(filter.toLowerCase()),
  );

export const getUniqueUsers = (
  users: $ReadOnlyArray<AutocompleteOption>,
): $ReadOnlyArray<AutocompleteOption> =>
  // TODO(email): switch to user ID
  uniqby(users, 'email');

export const getUsersAndWildcards = (users: $ReadOnlyArray<AutocompleteOption>) => [
  // TODO stop using makeUserId on these fake "user IDs"; have some
  //   more-explicit UI logic instead of these pseudo-users.
  { user_id: makeUserId(-1), full_name: 'all', email: '(Notify everyone)' },
  { user_id: makeUserId(-2), full_name: 'everyone', email: '(Notify everyone)' },
  ...users,
];

export const getAutocompleteSuggestion = (
  users: $ReadOnlyArray<AutocompleteOption>,
  filter: string = '',
  ownUserId: UserId,
): $ReadOnlyArray<AutocompleteOption> => {
  if (users.length === 0) {
    return users;
  }
  const allAutocompleteOptions = getUsersAndWildcards(users);
  const startWith = filterUserStartWith(allAutocompleteOptions, filter, ownUserId);
  const initials = filterUserByInitials(allAutocompleteOptions, filter, ownUserId);
  const contains = filterUserThatContains(allAutocompleteOptions, filter, ownUserId);
  const matchesEmail = filterUserMatchesEmail(users, filter, ownUserId);
  return getUniqueUsers([...startWith, ...initials, ...contains, ...matchesEmail]);
};

export const getAutocompleteUserGroupSuggestions = (
  userGroups: UserGroup[],
  filter: string = '',
): UserGroup[] =>
  userGroups.filter(
    userGroup =>
      userGroup.name.toLowerCase().includes(filter.toLowerCase())
      || userGroup.description.toLowerCase().includes(filter.toLowerCase()),
  );
