// @flow strict-local

import { viewportHeight } from './viewport';

const msglistElementsDiv = document.querySelector('div#msglist-elements');
if (!msglistElementsDiv) {
  throw new Error('No div#msglist-elements element!');
}

/**
 * The Zulip message ID of the given message element; throw if not a message.
 */
export function idFromMessage(element: Element): number {
  const idStr = element.getAttribute('data-msg-id');
  if (idStr === null || idStr === undefined) {
    throw new Error('Bad message element');
  }
  return +idStr;
}

/**
 * Returns a "message-list element" visible mid-screen, if any.
 *
 * A "message-list element" is a message or one of their siblings that get
 * laid out among them: e.g. a recipient bar or date separator, but not an
 * absolutely-positioned overlay. All message-list elements are direct
 * children of a div#msglist-elements.
 *
 * If the middle of the screen is just blank, returns null.
 */
function midMessageListElement(top: number, bottom: number): ?Element {
  // The assumption we depend on: any random widgets we draw that aren't
  // part of a message-list element are drawn *over* the message-list
  // elements, not under.
  //
  // By spec, the elements returned by Document#elementsFromPoint are in
  // paint order, topmost (and inmost) first.  By our assumption, that means
  // the sequence is:
  //   [ ...(random widgets, if any),
  //     ...(descendants of message-list element), message-list element,
  //     div#msglist-elements, body, html ]

  const midY = (bottom + top) / 2;

  const midElements = document.elementsFromPoint(0, midY);
  if (midElements.length < 4) {
    // Just [div#msglist-elements, body, html].
    return null;
  }
  return midElements[midElements.length - 4];
}

/**
 * An element is visible if any part of it is visible on screen.
 *
 * @param top The top of the screen (typically 0)
 * @param bottom The bottom of the screen (typically body.clientHeight)
 */
export function isVisible(element: Element, top: number, bottom: number): boolean {
  const rect = element.getBoundingClientRect();
  return top < rect.bottom && rect.top < bottom;
}

/**
 * Find a message element at or near the given element.
 *
 * The given element should be a "message-list element"; see
 * `midMessageListElement` for discussion.
 *
 * If the given element is a message, returns that element.  Otherwise,
 * returns the message that comes just after or just before it, depending on
 * the value of `step`.
 */
export function walkToMessage(
  start: ?Element,
  step: 'nextElementSibling' | 'previousElementSibling',
): ?Element {
  let element: ?Element = start;
  while (element && !element.classList.contains('message')) {
    // $FlowFixMe[prop-missing]: doesn't use finite type of `step`
    element = element[step];
  }
  return element;
}

/** The first message element in the document. */
export function firstMessage(): ?Element {
  return walkToMessage(msglistElementsDiv.firstElementChild, 'nextElementSibling');
}

/** The last message element in the document. */
export function lastMessage(): ?Element {
  return walkToMessage(msglistElementsDiv.lastElementChild, 'previousElementSibling');
}

/** The message before the given message, if any. */
export function previousMessage(start: Element): ?Element {
  return walkToMessage(start.previousElementSibling, 'previousElementSibling');
}

/** The message after the given message, if any. */
export function nextMessage(start: Element): ?Element {
  return walkToMessage(start.nextElementSibling, 'nextElementSibling');
}

/** Returns some message element which is visible, if any. */
export function someVisibleMessage(top: number, bottom: number): ?Element {
  function checkVisible(candidate: ?Element): ?Element {
    return candidate && isVisible(candidate, top, bottom) ? candidate : null;
  }
  // Algorithm: if some message-list element is visible, then either the
  // message just before or after it should be visible.  If not, we must be
  // at one end of the message list, meaning either the first or last
  // message (or both) should be visible.
  const midElement = midMessageListElement(top, bottom);
  return (
    checkVisible(walkToMessage(midElement, 'previousElementSibling'))
    || checkVisible(walkToMessage(midElement, 'nextElementSibling'))
    || checkVisible(firstMessage())
    || checkVisible(lastMessage())
  );
}

/*
 *
 * Read messages
 *
 */

/**
 * The number of pixels of the message that are allowed to be scrolled off
 * the bottom of the screen when we mark the message as "read".
 */
// Picked based on the bottom padding of messages in CSS. This doesn't work
// so great in cases where messages have the "edited" badge or reaction emojis,
// since the user needs to scorll to the bottom of the reaction emoji/edited
// badge section for the message to be "read", but it's more important for the
// single-line message case to not get inadvertently read than it is for
// messages to get marked read exactly when the bottom of the text of the
// message comes onto the screen. In the future, we may want more complicated
// behaviour here, but this should be fine for now.
const messageReadSlop = 16;

/**
 * A visible message is read when its bottom isn't too far down out of view.
 *
 * See `messageReadSlop` for specifically how far the bottom might be. The
 * idea is that a message becomes read when the bottom of its content
 * scrolls into view, excluding the padding between messages.
 *
 * This function doesn't check that the message is visible; it probably
 * makes sense to call only when `isVisible` is already known to be true.
 *
 * @param top The top of the screen (typically 0)
 * @param bottom The bottom of the screen (typically body.clientHeight)
 */
function isRead(element: Element, top: number, bottom: number): boolean {
  return bottom + messageReadSlop >= element.getBoundingClientRect().bottom;
}

/** Returns some message element which is both visible and read, if any. */
function someVisibleReadMessage(top: number, bottom: number): ?Element {
  function checkReadAndVisible(candidate: ?Element): ?Element {
    return candidate && isRead(candidate, top, bottom) && isVisible(candidate, top, bottom)
      ? candidate
      : null;
  }

  // Algorithm: If there's a visible message that isn't read, that means
  // it's partway off the bottom of the screen. Therefore, either:
  // * the message above it will be visible and read, or
  // * there are no visible read messages.
  const visible = someVisibleMessage(top, bottom);
  if (!visible) {
    return visible;
  }
  return checkReadAndVisible(visible) || checkReadAndVisible(previousMessage(visible));
}

/**
 * Returns the IDs of the first and last visible read messages, if any.
 *
 * If no messages are both visible and read, the return value has first > last.
 */
export function visibleReadMessageIds(): {| first: number, last: number |} {
  // Algorithm: We find some message that's both visible and read; then walk
  // both up and down from there to find all the visible read messages.

  const top = 0;
  const bottom = viewportHeight;
  let first = Number.MAX_SAFE_INTEGER;
  let last = 0;

  // Walk through visible-and-read elements, observing message IDs.
  function walkElements(start: ?Element, step: 'nextElementSibling' | 'previousElementSibling') {
    let element = start;
    while (element && isVisible(element, top, bottom) && isRead(element, top, bottom)) {
      if (element.classList.contains('message')) {
        const id = idFromMessage(element);
        first = Math.min(first, id);
        last = Math.max(last, id);
      }
      // $FlowFixMe[prop-missing]: doesn't use finite type of `step`
      element = element[step];
    }
  }

  const start = someVisibleReadMessage(top, bottom);
  walkElements(start, 'nextElementSibling');
  walkElements(start, 'previousElementSibling');

  return { first, last };
}

/**
 * Set the 'data-read' attribute to a given range of message elements.
 * This is styled with css to indicate visually what messages are being read.
 */
export const setMessagesReadAttributes = (rangeHull: { first: number, last: number }) => {
  let element = document.querySelector(`[data-msg-id='${rangeHull.first}']`);
  while (element) {
    if (element.classList.contains('message')) {
      element.setAttribute('data-read', 'true');
      if (idFromMessage(element) >= rangeHull.last) {
        break;
      }
    }
    element = element.nextElementSibling;
  }
};
