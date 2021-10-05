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

// prettier-ignore
type ActivelySerialized =
 | {| __serializedType__: 'ZulipVersion', data: string |}
 | {| __serializedType__: 'URL', data: string |}
 | {| __serializedType__: 'GravatarURL' | 'UploadedAvatarURL' | 'FallbackAvatarURL',
     data: string |}
 | {| __serializedType__: 'ImmutableList', data: $ReadOnlyArray<mixed> |}
 | {| __serializedType__: 'ImmutableMap' | 'ImmutableMapNumKeys', data: { ... } |}
 | {| __serializedType__: 'Object',
      data: { ... }, __serializedType__value: mixed |}
 ;

// prettier-ignore
type Serialized =
 ActivelySerialized
 //  | { ... } // but actually any object *without* a __serializedType__ property
 | $ReadOnlyArray<mixed>
 | null | string | number | boolean
 ;

/**
 * Custom replacer for inventive data types JSON doesn't handle.
 *
 * To be passed to `JSON.stringify` as its second argument. New
 * replacement logic must also appear in `reviver` so they stay in
 * sync.
 */
// Don't make this an arrow function -- we need `this` to be a special
// value; see
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter.
function replacer(key: string, value: mixed): Serialized {
  // The value at the current path before JSON.stringify called its
  // `toJSON` method, if present.
  //
  // When identifying what kind of thing we're working with, we
  // examine `origValue` instead of `value`, just in case calling
  // `toJSON` on that kind of thing would remove its identifying
  // features -- which is to say, just in case that kind of thing has
  // a `toJSON` method.
  //
  // For things that have a `toJSON` method, it may be convenient to
  // set `data` to `value`, if we trust that `toJSON` gives the output
  // we want to store there. And it would mean we don't discard the
  // work `JSON.stringify` did by calling `toJSON`.
  const origValue: mixed = this[key];

  if (typeof origValue !== 'object' || origValue === null) {
    // `origValue` can't be one of our interesting data types, so,
    // just return it.
    return origValue;
  }

  /* eslint-disable id-match */
  // prettier-ignore
  switch (Object.getPrototypeOf(origValue)) {
    // Flow bug: https://github.com/facebook/flow/issues/6110
    case (ZulipVersion.prototype: $FlowIssue):
      // $FlowIssue[incompatible-cast]: should refine on the prototype
      return { data: (origValue: ZulipVersion).raw(), __serializedType__: 'ZulipVersion' };
    case (URL.prototype: $FlowIssue):
      return { data: origValue.toString(), __serializedType__: 'URL' };
    case (GravatarURL.prototype: $FlowIssue):
      // $FlowIssue[incompatible-call]: should refine on the prototype
      return { data: GravatarURL.serialize(origValue), __serializedType__: 'GravatarURL' };
    case (UploadedAvatarURL.prototype: $FlowIssue):
      return {
        // $FlowIssue[incompatible-call]: should refine on the prototype
        data: UploadedAvatarURL.serialize(origValue),
        __serializedType__: 'UploadedAvatarURL',
      };
    case (FallbackAvatarURL.prototype: $FlowIssue):
      return {
        // $FlowIssue[incompatible-call]: should refine on the prototype
        data: FallbackAvatarURL.serialize(origValue),
        __serializedType__: 'FallbackAvatarURL',
      };
    case (Immutable.List.prototype: $FlowIssue):
      // $FlowIgnore[incompatible-cast]: List#toJSON returns an array
      return { data: (value: $ReadOnlyArray<mixed>), __serializedType__: 'ImmutableList' };
    case (Immutable.Map.prototype: $FlowIssue): {
      // $FlowIssue[incompatible-cast]: should refine on the prototype
      const firstKey = (origValue: Immutable.Map<mixed, mixed>).keySeq().first();
      return {
        // $FlowIgnore[incompatible-cast]: Map#toJSON returns an object
        data: (value: { ... }),

        // We assume that any `Immutable.Map` will have
        //   - all string keys,
        //   - all numeric keys, or
        //   - no keys (be empty).
        //
        // We store string-keyed maps with `ImmutableMap`,
        // number-keyed maps with `ImmutableMapNumKeys`, and empty
        // maps with either one of those (chosen arbitrarily) because
        // the reviver will give the same output for both of them
        // (i.e., an empty `Immutable.Map`).
        __serializedType__:
          typeof firstKey === 'number' ? 'ImmutableMapNumKeys' : 'ImmutableMap',
      };
    }
    default: {
      // If the identity of the first item in the prototype chain
      // isn't good enough as a distinguishing mark, we can put some
      // plain conditions here.
    }
  }

  // Don't forget to handle a value's `toJSON` method, if present, as
  // described above.
  invariant(typeof origValue.toJSON !== 'function', 'unexpected toJSON');

  // If storing an interesting data type, don't forget to handle it
  // here, and in `reviver`.
  const origValuePrototype = Object.getPrototypeOf(origValue);
  invariant(
    // Flow bug: https://github.com/facebook/flow/issues/6110
    origValuePrototype === (Object.prototype: $FlowIssue)
      || origValuePrototype === (Array.prototype: $FlowIssue),
    'unexpected class',
  );

  // Ensure that objects with a [SERIALIZED_TYPE_FIELD_NAME] property
  // round-trip.
  if (SERIALIZED_TYPE_FIELD_NAME in origValue) {
    const copy = { ...origValue };
    delete copy[SERIALIZED_TYPE_FIELD_NAME];
    return {
      [SERIALIZED_TYPE_FIELD_NAME]: 'Object',
      data: copy,
      [SERIALIZED_TYPE_FIELD_NAME_ESCAPED]: origValue[SERIALIZED_TYPE_FIELD_NAME],
    };
  }

  return origValue;
}

/**
 * Custom reviver for inventive data types JSON doesn't handle.
 *
 * To be passed to `JSON.parse` as its second argument. New
 * reviving logic must also appear in `replacer` so they stay in
 * sync.
 */
function reviver(key: string, actualValue: mixed) {
  const value1: Serialized = actualValue;
  if (value1 !== null && typeof value1 === 'object' && SERIALIZED_TYPE_FIELD_NAME in value1) {
    const value: ActivelySerialized = value1;
    switch (value.__serializedType__) {
      case 'ZulipVersion':
        return new ZulipVersion(value.data);
      case 'URL':
        return new URL(value.data);
      case 'GravatarURL':
        return GravatarURL.deserialize(value.data);
      case 'UploadedAvatarURL':
        return UploadedAvatarURL.deserialize(value.data);
      case 'FallbackAvatarURL':
        return FallbackAvatarURL.deserialize(value.data);
      case 'ImmutableList':
        return Immutable.List(value.data);
      case 'ImmutableMap':
        return Immutable.Map(value.data);
      case 'ImmutableMapNumKeys': {
        const data = value.data;
        return Immutable.Map(Object.keys(data).map(k => [Number.parseInt(k, 10), data[k]]));
      }
      case 'Object':
        return {
          ...value.data,
          [SERIALIZED_TYPE_FIELD_NAME]: value[SERIALIZED_TYPE_FIELD_NAME_ESCAPED],
        };
      default:
        // This should be impossible for data that came from our
        // corresponding replacer, above.  If we do have a bug that leads to
        // this case, there's nothing we can return that isn't likely to be
        // a corrupt data structure that causes a crash somewhere else
        // downstream; so just fail immediately.
        throw new Error(`Unhandled serialized type: ${value[SERIALIZED_TYPE_FIELD_NAME]}`);
    }
  }
  return value;
}

export function stringify(data: mixed): string {
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
}

export function parse(data: string): mixed {
  return JSON.parse(data, reviver);
}
