/* @flow strict-local */
import type { Auth } from '../types';
import { getAuthHeaders } from '../api/transport';
import objectEntries from './objectEntries';

/**
 * An object `encodeParamsForUrl` can flatten.
 *
 * In principle the values should be strings; but we include some other
 * primitive types for which `toString` is just as good as `JSON.stringify`.
 */
export type UrlParamValue = string | boolean | number;
export type UrlParams = $ReadOnly<{ [string]: UrlParamValue | void }>;

/**
 * Encode parameters as if for the URL query-part submitting an HTML form.
 *
 * Following the pattern of JSON.stringify, drop (rather than encoding in any
 * fashion) parameters whose provided value is `undefined`.
 */
export const encodeParamsForUrl = (params: UrlParams): string =>
  objectEntries(params)
    /* Filter out entries with `undefined` values, with type-level recognition.
       (Flow's core definitions treat `.filter(Boolean)` as a special case. See
       https://github.com/facebook/flow/issues/1414 for more information.) */
    .map(([key, value]): ?[string, UrlParamValue] => (value === undefined ? null : [key, value]))
    .filter(Boolean)
    /* Encode. */
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`)
    .join('&');

/**
 * Test for an absolute URL, assuming a valid URL.
 *
 * Specifically, we assume the input is a "valid URL string" as defined by
 * the URL Standard:
 *   https://url.spec.whatwg.org/#url-writing
 * and return true just if it's an "absolute-URL-with-fragment string".
 *
 * If the input is not a valid URL string, the result is unspecified.
 */
export const isUrlAbsolute = (url: string): boolean =>
  // True just if the string starts with a "URL-scheme string", then `:`.
  // Every "absolute-URL string" must do so.
  // Every "relative-URL string" must not do so: either it starts with a
  //   "path-relative-scheme-less-URL string", or it starts with `/`.
  url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/) !== null;

/**
 * Test for a relative URL string, assuming a valid URL.
 *
 * Specifically, we assume the input is a "valid URL string" as defined by
 * the URL Standard:
 *   https://url.spec.whatwg.org/#url-writing
 * and return true just if it's a "relative-URL-with-fragment string".
 *
 * If the input is not a valid URL string, the result is unspecified.
 */
export const isUrlRelative = (url: string): boolean => !isUrlAbsolute(url);

/**
 * Test for a path-absolute URL string, assuming a valid URL.
 *
 * Specifically, we assume the input is a "valid URL string" as defined by
 * the URL Standard:
 *   https://url.spec.whatwg.org/#url-writing
 * and return true just if it's a "path-absolute-URL string".
 *
 * This is the kind like "/foo/bar" that keeps the part of the base URL
 * before the path, and replaces the rest.
 *
 * Specifically this is a kind of relative URL string: so when this returns
 * true (for a valid URL), `isUrlRelative` will always also return true and
 * `isUrlAbsolute` will return false.
 */
export const isUrlPathAbsolute = (url: string): boolean =>
  // A "path-absolute URL string" must start with `/` and not `//`.
  // On the other hand:
  //  * a "path-relative scheme-less-URL string" must not start with `/`;
  //  * the other forms of "relative-URL string" all must start with `//`.
  !!url.match(/^\/($|[^\/])/); // eslint-disable-line no-useless-escape
// ESLint says one of these slashes could be written unescaped.
//   But that seems like a recipe for confusion, so we escape them both.

/** Just like `new URL`, but on error return undefined instead of throwing. */
export const tryParseUrl = (url: string, base?: string | URL): URL | void => {
  try {
    return new URL(url, base);
  } catch (e) {
    return undefined;
  }
};

/**
 * Resolve a possibly-relative URL, with realm URL as base, hastily.
 *
 * Assumes `url` is a valid URL string, and `realm` a valid Zulip realm URL,
 * with `realm.href` is just `realm.origin` modulo a trailing slash.
 *
 * The canonical resolved URL string would be `new URL(url, realm).href`.
 * This function returns an absolute URL string which is equivalent to the
 * canonical resolved URL string (meaning it parses to the same URL), but
 * may not be the same string.
 *
 * That is, we always have:
 *   new URL(resolveUrl(url, realm)).href === new URL(url, realm).href
 * but may have
 *           resolveUrl(url, realm)       !== new URL(url, realm).href
 *
 * (For example, if `url` contains path components like `.` or `..`, or any
 * non-ASCII code points, then the return value may contain similar
 * features.  URL parsing will canonicalize out such path components and
 * percent-encode such code points.)
 *
 * This function is useful because it is more efficient than `new URL`.
 *
 * If `url` is not a valid URL string or `realm` not a valid Zulip realm
 * URL, the result is unspecified.
 */
export const resolveUrl = (url: string, realm: URL): string => {
  // See the URL Standard for the definitions of quoted terms:
  //   https://url.spec.whatwg.org/#url-writing

  if (isUrlAbsolute(url)) {
    // An absolute URL (that is, "absolute-URL-with-fragment string").
    // `new URL(…)` would ignore the base URL.
    return url;
  }

  if (isUrlPathAbsolute(url)) {
    // The kind of relative URL we routinely use, like `/foo/bar`.
    // `new URL(…)` would borrow all of `realm` before the path -- which is
    // all of `realm` except its trailing slash.  This coincides with
    // `realm.origin`.
    return realm.origin + url;
  }

  if (!url.startsWith('//')) {
    // A path-relative URL (that is, a "relative-URL-with-fragment string"
    // in which the "relative-URL string" is a "path-relative URL string".)
    // Now `new URL(…)` would borrow all of `realm`, including its trailing
    // slash.
    //
    // We're relying heavily here on the assumption that `realm` has a path
    // of just `/`, empty query, and empty fragment.
    return realm.href + url;
  }

  // A scheme-relative URL, like `//chat.example/foo/bar`.
  // `new URL(…)` would borrow the scheme from `realm` but nothing else.
  return `${realm.protocol}${url}`;
};

/**
 * Test if the given URL points within the realm, taking the realm as base URL.
 *
 * This is equivalent to (but more efficient than) asking if
 *
 *     new URL(url, realm).href.startsWith(realm.href)
 *
 * provided `url` is a valid URL string, and given our usual assumption that
 * `realm.href` is just `realm.origin` modulo a trailing slash.
 *
 * If `url` is not a valid URL string, the result is unspecified.
 */
export const isUrlOnRealm = (url: string, realm: URL): boolean => {
  // See the URL Standard for the definitions of quoted terms:
  //   https://url.spec.whatwg.org/#url-writing

  if (isUrlAbsolute(url)) {
    // An absolute URL (that is, "absolute-URL-with-fragment string").
    // `new URL(url, realm)` would be equivalent to just `new URL(url)`.
    return url.startsWith(realm.href);
  }
  // A relative URL string of some kind.  In the standard's terms: a
  // "relative-URL-with-fragment string", which starts with some kind of
  // "relative-URL string".

  if (!url.startsWith('//')) {
    // The "relative-URL string" is a "path-absolute-URL string" or
    // "path-relative-URL string".   Either way, `new URL(url, realm)` would
    // borrow all of `realm` before the path -- which is all of `realm`.
    return true;
  }

  // A scheme-relative URL.  (These are pretty uncommon; they look like
  // `//chat.example.org/foo`.)  In this case, `new URL(url, realm)` would
  // borrow the scheme from `realm` but nothing else.
  const resolvedUrl = realm.protocol + url;
  return resolvedUrl.startsWith(realm.href);
};

const getResourceWithAuth = (uri: string, auth: Auth) => ({
  uri: new URL(uri, auth.realm).toString(),
  headers: getAuthHeaders(auth),
});

const getResourceNoAuth = (uri: string) => ({
  uri,
});

export const getResource = (
  uri: string,
  auth: Auth,
): {| uri: string, headers?: { [string]: string } |} =>
  isUrlOnRealm(uri, auth.realm) ? getResourceWithAuth(uri, auth) : getResourceNoAuth(uri);

export type Protocol = 'https://' | 'http://';

const protocolRegex = /^\s*((?:http|https):\/\/)(.*)$/;

const hasProtocol = (url: string = '') => url.search(protocolRegex) !== -1;

// Split a (possible) URL into protocol and non-protocol parts.
// The former will be null if no recognized protocol is a component
// of the string.
//
// Ignores initial spaces.
/** PRIVATE -- exported only for testing */
export const parseProtocol = (value: string): [Protocol | null, string] => {
  const match = protocolRegex.exec(value);

  if (match) {
    const [, protocol, rest] = match;
    if (protocol === 'http://' || protocol === 'https://') {
      return [protocol, rest];
    } else {
      throw new Error(`impossible match: protocol = '${escape(protocol)}'`);
    }
  }
  return [null, value];
};

export const fixRealmUrl = (url: string = '') => {
  if (url === '') {
    return '';
  }
  const trimmedUrl = url
    .replace(/\s/g, '') // strip any spaces, internal or otherwise
    .replace(/\/+$/, ''); // eliminate trailing slash(es)

  return hasProtocol(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

export const getFileExtension = (filename: string): string => filename.split('.').pop();

export const isUrlAnImage = (url: string): boolean =>
  ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(getFileExtension(url).toLowerCase());

const mimes = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  mov: 'video/quicktime',
};

export const getMimeTypeFromFileExtension = (extension: string): string =>
  mimes[extension.toLowerCase()] || 'application/octet-stream';

export type AutocompletionDefaults = {|
  protocol: Protocol,
  domain: string,
|};

export type AutocompletionPieces = [Protocol | null, string, string | null];

/**
 * A short list of some characters not permitted in subdomain name elements.
 */
const disallowedCharacters: Array<string> = [...'.:/'];

/**
 * Given user input purporting to identify a Zulip realm, provide a prefix,
 * derived value, and suffix which may suffice to turn it into a full URL.
 *
 * Presently, the derived value will always be equal to the input value;
 * this property should not be relied on, as it may change in future.
 */
export const autocompleteRealmPieces = (
  value: string,
  defaults: AutocompletionDefaults,
): AutocompletionPieces => {
  const [protocol, nonProtocolValue] = parseProtocol(value);

  const prefix = protocol === null ? defaults.protocol : null;

  // If the user supplies one of these characters, assume they know what they're doing.
  const suffix = disallowedCharacters.some(c => nonProtocolValue.includes(c))
    ? null
    : `.${defaults.domain}`;

  return [prefix, value, suffix];
};

export const autocompleteRealm = (value: string, data: AutocompletionDefaults): string =>
  value === ''
    ? ''
    : autocompleteRealmPieces(value, data)
        .filter(s => s)
        .join('');
