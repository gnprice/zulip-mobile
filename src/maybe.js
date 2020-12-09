/* @flow strict-local */

export function maybeAll<T>(items: $ReadOnlyArray<T | null | void>): $ReadOnlyArray<T> | null {
  if (!items.every(x => x != null)) {
    return null;
  }
  // $FlowFixMe -- Flow doesn't see the `every` check above
  return items;
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
