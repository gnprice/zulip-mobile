// @flow strict-local

import type {
  WebViewInboundEvent,
  WebViewInboundEventContent,
  WebViewInboundEventFetching,
  WebViewInboundEventTyping,
  WebViewInboundEventReady,
  WebViewInboundEventMessagesRead,
} from '../generateInboundEvents';
import { ensureUnreachable } from '../../generics';

import sendMessage from './sendMessage';
import InboundEventLogger from './InboundEventLogger';
import rewriteHtml from './rewriteHtml';
import { platformOS } from './globals';
import { someVisibleMessage, idFromMessage } from './messages';
import { viewportHeight } from './viewport';
import {
  disableScrollEvents,
  enableScrollEvents,
  isNearBottom,
  scrollToBottom,
  scrollToBottomIfNearEnd,
  scrollToMessage,
  scrollToPreserve,
  sendScrollMessageIfListShort,
} from './scroll';

const showHideElement = (elementId: string, show: boolean) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.toggle('hidden', !show);
  }
};

const msglistElementsDiv = document.querySelector('div#msglist-elements');
if (!msglistElementsDiv) {
  throw new Error('No div#msglist-elements element!');
}

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
  disableScrollEvents();
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
  enableScrollEvents();
};

export function installInboundEventHandler() {
  // Since its version 5.x, the `react-native-webview` library dispatches our
  // `message` events at `window` on iOS but `document` on Android.
  if (platformOS === 'ios') {
    window.addEventListener('message', handleMessageEvent);
  } else {
    document.addEventListener('message', handleMessageEvent);
  }

  // It's possible we could call this earlier, and would see some performance
  // benifit from doing so, since js.js takes about 16ms to run on a Pixel 3a.
  // However, I don't see that as being worth the possible bugs from things
  // loading too early.
  signalReadyForEvents();
}
