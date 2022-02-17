/**
 * Main entry point for our code running inside the message-list WebView.
 *
 * This file, together with the code it imports, does not run in the normal
 * React Native environment.  Instead, it runs in a browser environment
 * (Chrome when on Android, Safari when on iOS), inside a WebView, where we
 * present the message list.
 *
 * The way this code gets run is:
 *  * The script `tools/generate-webview-js`, using Babel and Rollup,
 *    compiles this file and its imports.  The result goes into
 *    `./generatedEs3.js`, as a giant string literal.
 *  * That file `generatedEs3.js` is imported by `./script.js`.  There the
 *    compiled code it contains, along with some other code, goes inside a
 *    `<script>` element in an HTML fragment string.
 *  * That string in turn becomes part of the HTML string passed in the
 *    `source` prop of the `WebView` component created in `MessageList`.
 *
 * This code does not run at the top level of the `<script>` element.
 * Rather, it goes inside an event listener for `DOMContentLoaded`.
 * (See `script.js`.)
 *
 * @flow strict-local
 */
/* eslint-disable no-useless-return */
import type { Auth } from '../../types';

import rewriteHtml from './rewriteHtml';
import { reportError } from './errors';
import { installPressHandlers } from './pressHandlers';
import {
  enableScrollEvents,
  installScrollHandler,
  scrollToMessage,
  sendScrollMessageIfListShort,
} from './scroll';
import { installInboundEventHandler } from './inboundEvents';

/*
 * Supported platforms:
 *
 * * (When updating these, be sure to update tools/generate-webview-js too.)
 *
 * * We support iOS 12.  So this code needs to work on Mobile Safari 12.
 *   Graceful degradation is acceptable below iOS 14 / Mobile Safari 14.
 *
 * * For Android, core functionality needs to work on Chrome 51.
 *   Graceful degradation is acceptable below Chrome 74.
 *
 *   * These versions are found in stock images for Android 7 Nougat
 *     and Android 10, respectively, for convenient testing.
 *
 *   * (Note that Android's Chrome auto-updates independently of the OS, and
 *     the large majority of Android users have a fully-updated Chrome --
 *     more recent than the Safari on most iOS devices.)
 *
 * * See docs/architecture/platform-versions.md for data and discussion
 *   about our version-support strategy.
 */

window.onerror = reportError;

/*
 *
 * Identifying visible messages
 *
 */

installScrollHandler();

installInboundEventHandler();

installPressHandlers();

/**
 * Called by the `script.js` template immediately after this module's toplevel.
 *
 * (This provides a way for the template to pass arguments for this code to
 * use at initialization.)
 */
export const handleInitialLoad = (
  scrollMessageId: number | null,
  // The `realm` part of an `Auth` object is a URL object. It's passed
  // in its stringified form.
  rawAuth: {| ...$Diff<Auth, {| realm: mixed |}>, realm: string |},
) => {
  const auth: Auth = { ...rawAuth, realm: new URL(rawAuth.realm) };

  scrollToMessage(scrollMessageId);
  rewriteHtml(auth);
  sendScrollMessageIfListShort();
  enableScrollEvents();
};
