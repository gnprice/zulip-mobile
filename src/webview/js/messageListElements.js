// @flow strict-local

const msglistElementsDiv = document.querySelector('div#msglist-elements');
if (!msglistElementsDiv) {
  throw new Error('No div#msglist-elements element!');
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
