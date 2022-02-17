// @flow strict-local

import { windowSmoothScroll } from './smoothScroll';

const documentBody = document.body;
if (!documentBody) {
  throw new Error('No document.body element!');
}

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
