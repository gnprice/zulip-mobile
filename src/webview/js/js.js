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
import type {
  WebViewInboundEvent,
  WebViewInboundEventContent,
  WebViewInboundEventFetching,
  WebViewInboundEventTyping,
  WebViewInboundEventReady,
  WebViewInboundEventMessagesRead,
} from '../generateInboundEvents';

import InboundEventLogger from './InboundEventLogger';
import sendMessage from './sendMessage';
import rewriteHtml from './rewriteHtml';
import { ensureUnreachable } from '../../generics';
import { reportError } from './errors';
import { platformOS, doNotMarkMessagesAsRead } from './globals';
import { clearLongPressTimeout, installPressHandlers } from './pressHandlers';
import {
  someVisibleMessage,
  idFromMessage,
  setMessagesReadAttributes,
  visibleReadMessageIds,
} from './messages';
import { viewportHeight } from './viewport';
import {
  isNearBottom,
  scrollToBottom,
  scrollToBottomIfNearEnd,
  scrollToMessage,
  scrollToPreserve,
} from './scroll';

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

// We pull out document.body in one place, and check it's not null, in order
// to provide that assertion to the type-checker.
const documentBody = document.body;
if (!documentBody) {
  throw new Error('No document.body element!');
}

const msglistElementsDiv = document.querySelector('div#msglist-elements');
if (!msglistElementsDiv) {
  throw new Error('No div#msglist-elements element!');
}

window.onerror = reportError;

const eventLogger = new InboundEventLogger();
eventLogger.startCapturing();
// After 10 seconds, if the loading placeholders are *still* visible,
// we want to know all the inbound events that were received in that
// time (with sensitive info redacted, of course).
setTimeout(() => {
  const placeholdersDiv = document.getElementById('message-loading');
  eventLogger.stopCapturing();
  if (placeholdersDiv && !placeholdersDiv.classList.contains('hidden')) {
    eventLogger.send();
  }
  eventLogger.reset();
}, 10000);

const showHideElement = (elementId: string, show: boolean) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.toggle('hidden', !show);
  }
};

/*
 *
 * Identifying visible messages
 *
 */

/*
 *
 * Reporting scrolls to outside, to mark messages as read
 *
 */

/**
 * The range of message IDs that were both visible and read whenever we last
 * checked.
 */
let prevMessageRange = visibleReadMessageIds();

const sendScrollMessage = () => {
  const messageRange = visibleReadMessageIds();
  // rangeHull is the convex hull of the previous range and the new one.
  // When the user is actively scrolling, the browser gives us scroll events
  // only occasionally, so we use this to interpolate scrolling past the
  // messages in between, as a partial workaround.
  const rangeHull = {
    first: Math.min(prevMessageRange.first, messageRange.first),
    last: Math.max(prevMessageRange.last, messageRange.last),
  };
  sendMessage({
    type: 'scroll',
    // See WebViewOutboundEventScroll for the meanings of these properties.
    offsetHeight: documentBody.offsetHeight,
    innerHeight: window.innerHeight,
    scrollY: window.scrollY,
    startMessageId: rangeHull.first,
    endMessageId: rangeHull.last,
  });
  if (!doNotMarkMessagesAsRead) {
    setMessagesReadAttributes(rangeHull);
  }
  // If there are no visible + read messages (for instance, the entire screen
  // is taken up by a single large message), then we don't want to update
  // prevMessageRange.  This way, if the user scrolled past some messages to
  // get here, then even though `messageRange` was empty this time and so we
  // didn't mark any messages as read just now, we'll include those in
  // `rangeHull` the next time the user scrolls and so we'll mark them as read
  // then.
  if (messageRange.first < messageRange.last) {
    prevMessageRange = messageRange;
  }
};

// If the message list is too short to scroll, fake a scroll event
// in order to cause the messages to be marked as read.
const sendScrollMessageIfListShort = () => {
  if (documentBody.scrollHeight === documentBody.clientHeight) {
    sendScrollMessage();
  }
};

/**
 * Disable reporting scrolls to the outside to mark messages as read.
 *
 * This is set while we're first setting up after the content loads, and
 * while we're handling `message` events from the outside and potentially
 * rewriting the content.
 */
let scrollEventsDisabled = true;

const handleScrollEvent = () => {
  clearLongPressTimeout();
  if (scrollEventsDisabled) {
    return;
  }

  sendScrollMessage();

  const nearEnd = documentBody.offsetHeight - window.scrollY - window.innerHeight > 100;
  showHideElement('scroll-bottom', nearEnd);
};

window.addEventListener('scroll', handleScrollEvent);

/*
 *
 * Updating message content, and re-scrolling
 *
 */

type ScrollTarget =
  | {| type: 'none' |}
  | {| type: 'bottom' |}
  | {| type: 'anchor', messageId: number | null |}
  | {| type: 'preserve', msgId: number, prevBoundTop: number |};

// Try to identify a message on screen and its location, so we can
// scroll the corresponding message to the same place afterward.
const findPreserveTarget = (): ScrollTarget => {
  const message = someVisibleMessage(0, viewportHeight);
  if (!message) {
    // TODO log this -- it's an error which the user will notice.
    // (We don't attempt this unless there are messages already,
    // which we really want to keep steady in view.)
    return { type: 'none' };
  }
  const messageId = idFromMessage(message);
  const prevBoundRect = message.getBoundingClientRect();
  return { type: 'preserve', msgId: messageId, prevBoundTop: prevBoundRect.top };
};

/**
 * Run a function after layout properties have updated from DOM changes.
 *
 * This is important if we have just set innerHTML and need to read
 * properties like `scrollHeight` from the DOM, as the re-layout may happen
 * asynchronously.
 */
const runAfterLayout = (fn: () => void) => {
  if (platformOS === 'android') {
    // On Android/Chrome, empirically the updates happen synchronously, so
    // there's no need to delay.  See discussion:
    //   https://github.com/zulip/zulip-mobile/pull/4370
    fn();
    return;
  }

  // On iOS/Safari, we must wait.  See:
  //   https://macarthur.me/posts/when-dom-updates-appear-to-be-asynchronous
  requestAnimationFrame(() => {
    // this runs immediately before the next repaint
    fn();
  });
};

const handleInboundEventContent = (uevent: WebViewInboundEventContent) => {
  const { scrollStrategy } = uevent;
  let target: ScrollTarget;
  switch (scrollStrategy) {
    case 'none':
      target = { type: 'none' };
      break;
    case 'scroll-to-anchor':
      target = { type: 'anchor', messageId: uevent.scrollMessageId };
      break;
    case 'scroll-to-bottom-if-near-bottom':
      target = isNearBottom() ? { type: 'bottom' } : findPreserveTarget();
      break;
    case 'preserve-position':
      target = findPreserveTarget();
      break;
    default:
      ensureUnreachable(scrollStrategy);
      target = findPreserveTarget();
      break;
  }

  msglistElementsDiv.innerHTML = uevent.content;

  rewriteHtml(uevent.auth);

  runAfterLayout(() => {
    if (target.type === 'bottom') {
      scrollToBottom();
    } else if (target.type === 'anchor') {
      scrollToMessage(target.messageId);
    } else if (target.type === 'preserve') {
      scrollToPreserve(target.msgId, target.prevBoundTop);
    }

    sendScrollMessageIfListShort();
  });
};

/*
 *
 * Handling other message-from-outside events
 *
 */

const handleInboundEventFetching = (uevent: WebViewInboundEventFetching) => {
  showHideElement('message-loading', uevent.showMessagePlaceholders);
  showHideElement('spinner-older', uevent.fetchingOlder);
  showHideElement('spinner-newer', uevent.fetchingNewer);
};

const handleInboundEventTyping = (uevent: WebViewInboundEventTyping) => {
  const elementTyping = document.getElementById('typing');
  if (elementTyping) {
    elementTyping.innerHTML = uevent.content;
    runAfterLayout(() => scrollToBottomIfNearEnd());
  }
};

let readyRetryInterval: IntervalID | void = undefined;

const signalReadyForEvents = () => {
  sendMessage({ type: 'ready' });

  // Keep retrying sending the ready event, in case the first one is sent while
  // the queue isn't ready. While this isn't something I've observed in testing,
  // we've previously had bugs that were caused by this (for instance, #3078)
  readyRetryInterval = setInterval(() => {
    sendMessage({ type: 'ready' });
  }, 100);
};

/**
 * Stop resending the handshake message once we confirm that the channel is
 * ready.
 */
const handleInboundEventReady = (uevent: WebViewInboundEventReady) => {
  clearInterval(readyRetryInterval);
};

/**
 * Handles messages that have been read outside of the WebView
 */
const handleInboundEventMessagesRead = (uevent: WebViewInboundEventMessagesRead) => {
  if (uevent.messageIds.length === 0) {
    return;
  }
  const selector = uevent.messageIds.map(id => `[data-msg-id="${id}"]`).join(',');
  const messageElements = document.querySelectorAll(selector);
  messageElements.forEach(element => {
    element.setAttribute('data-read', 'true');
  });
};

const inboundEventHandlers = {
  content: handleInboundEventContent,
  fetching: handleInboundEventFetching,
  typing: handleInboundEventTyping,
  ready: handleInboundEventReady,
  read: handleInboundEventMessagesRead,
};

// See just below for how this gets subscribed to events.
const handleMessageEvent: MessageEventListener = e => {
  scrollEventsDisabled = true;
  // This decoding inverts `base64Utf8Encode`.
  const decodedData = decodeURIComponent(escape(window.atob(e.data)));
  const rawInboundEvents = JSON.parse(decodedData);
  const inboundEvents: $ReadOnlyArray<WebViewInboundEvent> = rawInboundEvents.map(inboundEvent => ({
    ...inboundEvent,
    // A URL object doesn't round-trip through JSON; we get the string
    // representation. So, "revive" it back into a URL object.
    ...(inboundEvent.auth
      ? { auth: { ...inboundEvent.auth, realm: new URL(inboundEvent.auth.realm) } }
      : {}),
  }));

  inboundEvents.forEach((uevent: WebViewInboundEvent) => {
    eventLogger.maybeCaptureInboundEvent(uevent);
    // $FlowFixMe[incompatible-type]
    // $FlowFixMe[prop-missing]
    inboundEventHandlers[uevent.type](uevent);
  });
  scrollEventsDisabled = false;
};

// Since its version 5.x, the `react-native-webview` library dispatches our
// `message` events at `window` on iOS but `document` on Android.
if (platformOS === 'ios') {
  window.addEventListener('message', handleMessageEvent);
} else {
  document.addEventListener('message', handleMessageEvent);
}

installPressHandlers();

// It's possible we could call this earlier, and would see some performance
// benifit from doing so, since js.js takes about 16ms to run on a Pixel 3a.
// However, I don't see that as being worth the possible bugs from things
// loading too early.
signalReadyForEvents();

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
  scrollEventsDisabled = false;
};
