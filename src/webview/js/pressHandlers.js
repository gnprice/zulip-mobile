/*
 *
 * Handling user touches
 *
 * @flow strict-local
 */

import { makeUserId } from '../../api/idTypes';

import { nextMessage } from './messages';
import { scrollToBottom } from './scroll';
import sendMessage from './sendMessage';
import { toggleSpoiler } from './spoilers';

let hasLongPressed = false;
let longPressTimeout = undefined;
let lastTouchPositionX = -1;
let lastTouchPositionY = -1;

export const clearLongPressTimeout = () => {
  clearTimeout(longPressTimeout);
};

/** DEPRECATED */
const getMessageIdFromElement = (element: Element, defaultValue: number = -1): number => {
  const msgElement = element.closest('.msglist-element');
  return msgElement ? +msgElement.getAttribute('data-msg-id') : defaultValue;
};

/**
 * If the given message is muted, reveal it and all consecutive following
 * messages from the same user.
 */
const revealMutedMessages = (message: Element) => {
  let messageNode = message;
  do {
    messageNode.setAttribute('data-mute-state', 'shown');
    messageNode = nextMessage(messageNode);
  } while (messageNode && messageNode.classList.contains('message-brief'));
};

const requireAttribute = (e: Element, name: string): string => {
  const value = e.getAttribute(name);
  if (value === null || value === undefined) {
    throw new Error(`Missing expected attribute ${name}`);
  }
  return value;
};

/**
 * Returns the integer parsed value of a DOM element attribute.
 *
 * Throws if parsing fails.
 */
const requireNumericAttribute = (e: Element, name: string): number => {
  const value = requireAttribute(e, name);
  const parsedValue = parseInt(value, 10);
  if (Number.isNaN(parsedValue)) {
    throw new Error(`Could not parse attribute ${name} value '${value}' as integer`);
  }
  return parsedValue;
};

const handleClickEvent = (e: MouseEvent) => {
  e.preventDefault();
  clearTimeout(longPressTimeout);

  /* Without a flag `hasLongPressed`, both the short press and the long
   * press actions get triggered. See PR #3404 for more context. */
  if (hasLongPressed) {
    hasLongPressed = false;
    return;
  }

  const { target } = e;

  if (!(target instanceof Element)) {
    return;
  }

  if (target.matches('.scroll-bottom')) {
    scrollToBottom();
    return;
  }

  if (target.matches('.avatar-img') || target.matches('.username')) {
    sendMessage({
      type: 'request-user-profile',
      fromUserId: makeUserId(requireNumericAttribute(target, 'data-sender-id')),
    });
    return;
  }

  if (target.matches('.header')) {
    sendMessage({
      type: 'narrow',
      narrow: requireAttribute(target, 'data-narrow'),
    });
    return;
  }

  if (target.matches('.user-mention')) {
    sendMessage({
      type: 'mention',
      userId: makeUserId(requireNumericAttribute(target, 'data-user-id')),
    });
    return;
  }

  /* Should we pull up the lightbox?  For comparison, see the web app's
   * static/js/lightbox.js , starting at the `#main_div` click handler. */
  const inlineImageLink = target.closest('.message_inline_image a');
  if (
    inlineImageLink
    /* The web app displays certain videos inline, but on mobile
     * we'd rather let another app handle them, as links. */
    && !inlineImageLink.closest('.youtube-video, .vimeo-video')
  ) {
    sendMessage({
      type: 'image',
      src: requireAttribute(inlineImageLink, 'href'), // TODO: should be `src` / `data-src-fullsize`.
      messageId: getMessageIdFromElement(inlineImageLink),
    });
    return;
  }

  if (target.matches('.reaction')) {
    sendMessage({
      type: 'reaction',
      name: requireAttribute(target, 'data-name'),
      code: requireAttribute(target, 'data-code'),
      reactionType: requireAttribute(target, 'data-type'),
      messageId: getMessageIdFromElement(target),
      voted: target.classList.contains('self-voted'),
    });
    return;
  }

  if (target.matches('.poll-vote')) {
    const messageElement = target.closest('.message');
    if (!messageElement) {
      throw new Error('Message element not found');
    }
    // This duplicates some logic from PollData.handle.vote.outbound in
    // @zulip/shared/js/poll_data.js, but it's much simpler to just duplicate
    // it than it is to thread a callback all the way over here.
    const current_vote = requireAttribute(target, 'data-voted') === 'true';
    const vote = current_vote ? -1 : 1;
    sendMessage({
      type: 'vote',
      messageId: requireNumericAttribute(messageElement, 'data-msg-id'),
      key: requireAttribute(target, 'data-key'),
      vote,
    });
    target.setAttribute('data-voted', (!current_vote).toString());
    target.innerText = (parseInt(target.innerText, 10) + vote).toString();
    return;
  }

  if (target.matches('time')) {
    const originalText = requireAttribute(target, 'original-text');
    sendMessage({
      type: 'time',
      originalText,
    });
  }

  const closestA = target.closest('a');
  if (closestA) {
    sendMessage({
      type: 'url',
      href: requireAttribute(closestA, 'href'),
      messageId: getMessageIdFromElement(closestA),
    });
    return;
  }

  const spoilerHeader = target.closest('.spoiler-header');
  if (spoilerHeader instanceof HTMLElement) {
    toggleSpoiler(spoilerHeader);
    return;
  }

  const messageElement = target.closest('.message-brief');
  if (messageElement) {
    messageElement.getElementsByClassName('msg-timestamp')[0].classList.toggle('show');
  }
};

const handleLongPress = (target: Element) => {
  // The logic is believed not to cover all the cases it should; for
  // example, multi-touch events. Better would be to either find a
  // library we can use which strives to handle all that complexity, or
  // get long-press events from the platform.

  hasLongPressed = true;

  const reactionNode = target.closest('.reaction');
  if (reactionNode) {
    sendMessage({
      type: 'reactionDetails',
      messageId: getMessageIdFromElement(target),
      reactionName: requireAttribute(reactionNode, 'data-name'),
    });
    return;
  }

  // Prettier bug on nested ternary
  /* prettier-ignore */
  const targetType = target.matches('.header')
      ? 'header'
      : target.matches('a')
        ? 'link'
        : 'message';
  const messageNode = target.closest('.message');

  if (
    targetType === 'message'
    && messageNode
    && messageNode.getAttribute('data-mute-state') === 'hidden'
  ) {
    revealMutedMessages(messageNode);
    return;
  }

  sendMessage({
    type: 'longPress',
    target: targetType,
    messageId: getMessageIdFromElement(target),
    href: target.matches('a') ? requireAttribute(target, 'href') : null,
  });
};

const isNearPositions = (x1: number = 0, y1: number = 0, x2: number = 0, y2: number = 0): boolean =>
  Math.abs(x1 - x2) < 10 && Math.abs(y1 - y2) < 10;

export function installPressHandlers() {
  const documentBody = document.body;
  if (!documentBody) {
    throw new Error('No document.body element!');
  }

  documentBody.addEventListener('click', handleClickEvent);

  documentBody.addEventListener('touchstart', (e: TouchEvent) => {
    const { target } = e;
    if (e.changedTouches[0].pageX < 20 || !(target instanceof Element)) {
      return;
    }

    lastTouchPositionX = e.changedTouches[0].pageX;
    lastTouchPositionY = e.changedTouches[0].pageY;
    hasLongPressed = false;
    clearTimeout(longPressTimeout);
    longPressTimeout = setTimeout(() => handleLongPress(target), 500);
  });

  documentBody.addEventListener('touchend', (e: TouchEvent) => {
    if (
      isNearPositions(
        lastTouchPositionX,
        lastTouchPositionY,
        e.changedTouches[0].pageX,
        e.changedTouches[0].pageY,
      )
    ) {
      clearTimeout(longPressTimeout);
    }
  });

  documentBody.addEventListener('touchcancel', (e: TouchEvent) => {
    clearTimeout(longPressTimeout);
  });

  documentBody.addEventListener('touchmove', (e: TouchEvent) => {
    clearTimeout(longPressTimeout);
  });

  documentBody.addEventListener('drag', (e: DragEvent) => {
    clearTimeout(longPressTimeout);
  });
}
