/* @flow strict-local */
import md5 from 'blueimp-md5';

import type { Message, Outbox, UserOrBot } from '../types';
import { getFullUrl } from './url';

/**
 * When selecting the size of a gravatar we can pick any arbitrary
 * size we want. For server-uploaded avatars this is not the case.
 * We have only:
 *  * default - image is 100x100
 *  * medium - image is 500x500
 *
 * This function converts a normal avatar to medium-sized one.
 */
export const getMediumAvatar = (avatarUrl: string): string => {
  const url = new URL(avatarUrl);
  url.pathname = url.pathname.replace(/\.png$/, '-medium.png');
  return url.href;
};

export const getGravatarFromEmail = (email: string, size: number): string =>
  `https://secure.gravatar.com/avatar/${md5(email.toLowerCase())}?d=identicon&s=${size}`;

export const getAvatarUrl = (
  avatarUrl: ?string,
  email: string,
  realm: string,
  size: number = 80,
): string => {
  if (typeof avatarUrl !== 'string') {
    return getGravatarFromEmail(email, size);
  }

  const fullUrl = getFullUrl(avatarUrl, realm);

  return size > 100 ? getMediumAvatar(fullUrl) : fullUrl;
};

export const getAvatarFromUser = (user: UserOrBot, realm: string, size?: number): string =>
  getAvatarUrl(user.avatar_url, user.email, realm, size);

export const getAvatarFromMessage = (
  message: Message | Outbox,
  realm: string,
  size?: number,
): string => getAvatarUrl(message.avatar_url, message.sender_email, realm, size);
