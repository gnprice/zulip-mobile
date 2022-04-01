/* @flow strict-local */
import * as typeahead from '@zulip/shared/js/typeahead';

import type { ImageEmojiType, EmojiType, ReactionType } from '../types';
import { objectFromEntries } from '../jsBackport';
import { unicodeCodeByName, override } from './codePointMap';
import zulipExtraEmojiMap from './zulipExtraEmojiMap';
import objectEntries from '../utils/objectEntries';

const unicodeEmojiNames = Object.keys(unicodeCodeByName);

export const parseUnicodeEmojiCode = (code: string): string /* force line */ =>
  code
    .split('-')
    .map(hex => String.fromCodePoint(parseInt(hex, 16)))
    .join('');

export const codeToEmojiMap: {| [string]: string |} = objectFromEntries<string, string>(
  unicodeEmojiNames.map(name => {
    const code = unicodeCodeByName[name];
    const displayCode = override[code] || code;
    return [code, parseUnicodeEmojiCode(displayCode)];
  }),
);

// TODO(?): Stop having distinct `EmojiType` and `ReactionType`; confusing?
//   https://github.com/zulip/zulip-mobile/pull/5269#discussion_r818320669
export const reactionTypeFromEmojiType = (emojiType: EmojiType, name: string): ReactionType =>
  emojiType === 'image'
    ? zulipExtraEmojiMap[name]
      ? 'zulip_extra_emoji'
      : 'realm_emoji'
    : 'unicode_emoji';

// See comment on reactionTypeFromEmojiType, just above.
export const emojiTypeFromReactionType = (reactionType: ReactionType): EmojiType =>
  reactionType === 'unicode_emoji' ? 'unicode' : 'image';

/**
 * A list of emoji matching the query, in an order to offer to the user.
 *
 * Note that the same emoji may appear multiple times under different names.
 * This allows the user to choose which name to use; the chosen name is the
 * one that e.g. is shown to other users on hovering on a reaction.
 *
 * For example, 🗽, the Unicode emoji with code '1f5fd', has the names
 * :new_york:, :statue:, and :statue_of_liberty:, and a search like "statu"
 * or "🗽" itself will return two or all three of those, respectively.
 */
export const getFilteredEmojis = (
  query: string,
  activeImageEmojiByName: $ReadOnly<{| [string]: ImageEmojiType |}>,
): $ReadOnlyArray<{| emoji_type: EmojiType, name: string, code: string |}> => {
  type LocalEmoji = { emoji_name: string, emoji_code: string };

  const matcher = typeahead.get_emoji_matcher(query);

  const matchingUnicodeEmoji: Array<[string, LocalEmoji]> = [];
  for (const [name, code] of objectEntries(unicodeCodeByName)) {
    // This logic does not do any special handling for things like
    // skin-tone modifiers or gender modifiers, since Zulip does not
    // currently support those: https://github.com/zulip/zulip/issues/992.
    // Once support is added for that, we may want to come back here and
    // modify this logic, if for instance, there is a default skin-tone
    // setting in the webapp that we want to also surface here. (or
    // perhaps it will be best to leave it as is - that's a product
    // decision that's yet to be made.) For the time being, it seems
    // better to not show the user anything if they've searched for an
    // emoji with a modifier than it is to show them the non-modified
    // emoji, hence the very simple matching.
    const matchesEmojiLiteral = parseUnicodeEmojiCode(code) === query;
    const emoji = { emoji_name: name, emoji_code: code };
    if (!matchesEmojiLiteral && !matcher(emoji)) {
      continue;
    }
    matchingUnicodeEmoji.push([name, emoji]);
  }

  const matchingImageEmoji: Array<[string, LocalEmoji]> = [];
  for (const x of Object.keys(activeImageEmojiByName)) {
    const emoji = { emoji_name: x, emoji_code: activeImageEmojiByName[x].code };
    if (!matcher(emoji)) {
      continue;
    }
    matchingImageEmoji.push([x, emoji]);
  }

  const allMatchingEmoji: Map<string, LocalEmoji> = new Map([
    ...matchingUnicodeEmoji,
    ...matchingImageEmoji,
  ]);

  const emoji = typeahead.sort_emojis(Array.from(allMatchingEmoji.values()), query);

  return emoji.map(({ emoji_name: emojiName }) => {
    const isImageEmoji = activeImageEmojiByName[emojiName] !== undefined;
    return {
      name: emojiName,
      emoji_type: isImageEmoji ? 'image' : 'unicode',
      code: isImageEmoji ? activeImageEmojiByName[emojiName].code : unicodeCodeByName[emojiName],
    };
  });
};
