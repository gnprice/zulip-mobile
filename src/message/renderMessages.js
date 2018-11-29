/* @flow strict-local */
import type { Message, Narrow, Outbox, RenderedSectionDescriptor } from '../types';
import { isTopicNarrow, isPrivateOrGroupNarrow } from '../utils/narrow';
import { isSameRecipient } from '../utils/recipient';
import { isSameDay } from '../utils/date';

export default (
  messages: $ReadOnlyArray<Message | Outbox>,
  narrow: Narrow,
): RenderedSectionDescriptor[] => {
  let prevItem;
  const showHeader = !isPrivateOrGroupNarrow(narrow) && !isTopicNarrow(narrow);
  const sections = [{ data: [], message: {} }];
  messages.forEach(item => {
    const diffDays =
      prevItem && !isSameDay(new Date(prevItem.timestamp * 1000), new Date(item.timestamp * 1000));
    if (!prevItem || diffDays) {
      sections[sections.length - 1].data.push({
        type: 'time',
        timestamp: item.timestamp,
        firstMessage: item,
      });
    }
    const diffRecipient = !isSameRecipient(prevItem, item);
    if (showHeader && diffRecipient) {
      sections.push({
        message: item,
        data: [],
      });
    }
    const shouldGroupWithPrev =
      !diffRecipient
      && !diffDays
      && prevItem
      && prevItem.sender_full_name === item.sender_full_name;

    sections[sections.length - 1].data.push({
      type: 'message',
      isBrief: shouldGroupWithPrev,
      message: item,
    });

    prevItem = item;
  });
  return sections;
};
