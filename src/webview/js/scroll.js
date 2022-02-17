// @flow strict-local

/*:: import { doNotMarkMessagesAsRead } from './globals'; */
import { setMessagesReadAttributes, visibleReadMessageIds } from './messages';
import { clearLongPressTimeout } from './longPressTimeout';
import sendMessage from './sendMessage';
import { windowSmoothScroll } from './smoothScroll';

const documentBody = document.body;
if (!documentBody) {
  throw new Error('No document.body element!');
}

// TODO dedupe
const showHideElement = (elementId: string, show: boolean) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.toggle('hidden', !show);
  }
};

export const scrollToBottom = () => {
  windowSmoothScroll(0, documentBody.scrollHeight);
};

export const isNearBottom = (): boolean =>
  documentBody.scrollHeight - 100 < documentBody.scrollTop + documentBody.clientHeight;

export const scrollToBottomIfNearEnd = () => {
  if (isNearBottom()) {
    scrollToBottom();
  }
};

export const scrollToMessage = (messageId: number | null) => {
  const targetNode = messageId !== null ? document.getElementById(`msg-${messageId}`) : null;
  if (targetNode) {
    targetNode.scrollIntoView({ block: 'start' });
  } else {
    window.scroll({ left: 0, top: documentBody.scrollHeight + 200 });
  }
};

// Scroll the given message to the same height it was at before.
export const scrollToPreserve = (msgId: number, prevBoundTop: number) => {
  const newElement = document.getElementById(`msg-${msgId}`);
  if (!newElement) {
    // TODO log this -- it's an error which the user will notice.
    return;
  }
  const newBoundRect = newElement.getBoundingClientRect();
  window.scrollBy(0, newBoundRect.top - prevBoundTop);
};

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
export const sendScrollMessageIfListShort = () => {
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

export const enableScrollEvents = () => {
  scrollEventsDisabled = false;
};

export const disableScrollEvents = () => {
  scrollEventsDisabled = true;
};

const handleScrollEvent = () => {
  clearLongPressTimeout();
  if (scrollEventsDisabled) {
    return;
  }

  sendScrollMessage();

  const nearEnd = documentBody.offsetHeight - window.scrollY - window.innerHeight > 100;
  showHideElement('scroll-bottom', nearEnd);
};

export function installScrollHandler() {
  window.addEventListener('scroll', handleScrollEvent);
}
