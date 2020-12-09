/* @flow strict-local */

export function maybeAll<T>(items: $ReadOnlyArray<T | null | void>): $ReadOnlyArray<T> | null {
  if (!items.every(x => x != null)) {
    return null;
  }
  // $FlowFixMe -- Flow doesn't see the `every` check above
  return items;
}

export function maybeMapAll<A, B>(items: $ReadOnlyArray<A>, f: A => B | null | void): B[] | null {
  const result = [];
  for (const x of items) {
    const ret = f(x);
    if (ret == null) {
      return null;
    }
    result.push(ret);
  }
  return result;
}

export function maybeGetAll<K, V>(map: Map<K, V>, keys: $ReadOnlyArray<K>): V[] | null {
  const result = [];
  for (const key of keys) {
    const value = map.get(key);
    if (value === undefined) {
      return null;
    }
    result.push(value);
  }
  return result;
}
