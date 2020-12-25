/* @flow strict-local */
import invariant from 'invariant';
import Immutable from 'immutable';

import { ZulipVersion } from '../utils/zulipVersion';
import { GravatarURL, UploadedAvatarURL, FallbackAvatarURL } from '../utils/avatar';

/**
 * PRIVATE: Exported only for tests.
 *
 * A special identifier for the type of thing to be replaced/revived.
 *
 * Use this in the replacer and reviver, below, to make it easier to
 * be consistent between them and avoid costly typos.
 */
export const SERIALIZED_TYPE_FIELD_NAME: '__serializedType__' = '__serializedType__';

/**
 * Like SERIALIZED_TYPE_FIELD_NAME, but with a distinguishing mark.
 *
 * Used in our strategy to ensure successful round-tripping when data
 * has a key identical to SERIALIZED_TYPE_FIELD_NAME.
 */
const SERIALIZED_TYPE_FIELD_NAME_ESCAPED: '__serializedType__value' = '__serializedType__value';

// If a value's prototype chain starts with one of these, then the
// value doesn't need special handling in our replacer --
// JSON.stringify will handle it just fine.
const boringPrototypes = [
  Object.prototype,
  Array.prototype,
  Number.prototype,
  String.prototype,
  Boolean.prototype,
];

// Don't make this an arrow function -- we need `this` to be a special
// value; see
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter.
const replacer = function replacer(key, defaultReplacedValue) {
  // The value at the current path before JSON.stringify called its
  // `toJSON` method, if present.
  //
  // When identifying what kind of thing we're working with, be sure to
  // examine `origValue` instead of `defaultReplacedValue`, if calling
  // `toJSON` on that kind of thing would remove its identifying features --
  // which is to say, if that kind of thing has a `toJSON` method.
  //
  // For things that have a `toJSON` method, it may be convenient to set
  // `data` to `defaultReplacedValue`, if we trust that `toJSON` gives the
  // output we want to store there. And it would mean we don't discard the
  // work `JSON.stringify` did by calling `toJSON`.
  const origValue = this[key];

  if (origValue instanceof ZulipVersion) {
    return { data: origValue.raw(), [SERIALIZED_TYPE_FIELD_NAME]: 'ZulipVersion' };
  } else if (origValue instanceof URL) {
    return { data: origValue.toString(), [SERIALIZED_TYPE_FIELD_NAME]: 'URL' };
  } else if (origValue instanceof GravatarURL) {
    return { data: GravatarURL.serialize(origValue), [SERIALIZED_TYPE_FIELD_NAME]: 'GravatarURL' };
  } else if (origValue instanceof UploadedAvatarURL) {
    return {
      data: UploadedAvatarURL.serialize(origValue),
      [SERIALIZED_TYPE_FIELD_NAME]: 'UploadedAvatarURL',
    };
  } else if (origValue instanceof FallbackAvatarURL) {
    return {
      data: FallbackAvatarURL.serialize(origValue),
      [SERIALIZED_TYPE_FIELD_NAME]: 'FallbackAvatarURL',
    };
  } else if (Immutable.Map.isMap(origValue)) {
    // Immutable.Map#toJSON returns a nice JSONable object-as-map,
    // so we use `defaultReplacedValue` which is the result of that.
    return { data: defaultReplacedValue, [SERIALIZED_TYPE_FIELD_NAME]: 'ImmutableMap' };
  }

  // `origValue.toJSON` and `Object.getPrototypeOf(origValue)` fail
  // if origValue is undefined or null.
  if (origValue !== undefined && origValue !== null) {
    // Don't forget to handle a value's `toJSON` method, if present, as
    // described above.
    invariant(typeof origValue.toJSON !== 'function', 'unexpected toJSON');

    // If storing an interesting data type, don't forget to handle it
    // here, and in `reviver`.
    invariant(boringPrototypes.includes(Object.getPrototypeOf(origValue)), 'unexpected class');
  }

  if (
    typeof origValue === 'object'
    && origValue !== null
    && SERIALIZED_TYPE_FIELD_NAME in origValue
  ) {
    const copy = { ...origValue };
    delete copy[SERIALIZED_TYPE_FIELD_NAME];
    return {
      [SERIALIZED_TYPE_FIELD_NAME]: 'Object',
      data: copy,
      [SERIALIZED_TYPE_FIELD_NAME_ESCAPED]: origValue[SERIALIZED_TYPE_FIELD_NAME],
    };
  }

  return origValue;
};

const reviver = function reviver(key, value) {
  if (value !== null && typeof value === 'object' && SERIALIZED_TYPE_FIELD_NAME in value) {
    const data = value.data;
    switch (value[SERIALIZED_TYPE_FIELD_NAME]) {
      case 'ZulipVersion':
        return new ZulipVersion(data);
      case 'URL':
        return new URL(data);
      case 'GravatarURL':
        return GravatarURL.deserialize(data);
      case 'UploadedAvatarURL':
        return UploadedAvatarURL.deserialize(data);
      case 'FallbackAvatarURL':
        return FallbackAvatarURL.deserialize(data);
      case 'ImmutableMap':
        return Immutable.Map(data);
      case 'Object':
        return {
          ...data,
          [SERIALIZED_TYPE_FIELD_NAME]: value[SERIALIZED_TYPE_FIELD_NAME_ESCAPED],
        };
      default:
        return data;
    }
  }
  return value;
};
/** PRIVATE: Exported only for tests. */
export const stringify = function stringify(data: mixed): string {
  const result = JSON.stringify(data, replacer);
  if (result === undefined) {
    // Flow says that the output for JSON.stringify could be
    // undefined. From MDN:
    //
    // `JSON.stringify()` can return `undefined` when passing in
    // "pure" values like `JSON.stringify(function(){})` or
    // `JSON.stringify(undefined)`.
    //
    // We don't expect any of those inputs, but we'd want to know if
    // we get one, since it means something has gone quite wrong.
    throw new Error('undefined result for stringify');
  }
  return result;
};

/** PRIVATE: Exported only for tests. */
export const parse = function parse(data: string): mixed {
  return JSON.parse(data, reviver);
};
