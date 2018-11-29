/* @flow strict-local */
import type { Message, Narrow, Outbox, RenderedMessages } from '../types';
import { isTopicNarrow, isPrivateOrGroupNarrow } from '../utils/narrow';
import { isSameRecipient } from '../utils/recipient';
import { isSameDay } from '../utils/date';

export default (messages: $ReadOnlyArray<Message | Outbox>, narrow: Narrow): RenderedMessages => {
  let prevItem;
  const showHeader = !isPrivateOrGroupNarrow(narrow) && !isTopicNarrow(narrow);
  const items = [];
  messages.forEach(item => {
    const diffDays =
      prevItem && !isSameDay(new Date(prevItem.timestamp * 1000), new Date(item.timestamp * 1000));
    if (!prevItem || diffDays) {
      items.push({
        type: 'time',
        timestamp: item.timestamp,
        firstMessage: item,
      });
    }
    const diffRecipient = !isSameRecipient(prevItem, item);
    if (showHeader && diffRecipient) {
      items.push({
        ...item,
      });
    }
    const shouldGroupWithPrev =
      !diffRecipient
      && !diffDays
      && prevItem
      && prevItem.sender_full_name === item.sender_full_name;

    items.push({
      type: 'message',
      isBrief: shouldGroupWithPrev,
      message: item,
    });

    prevItem = item;
  });
  return items;
};
