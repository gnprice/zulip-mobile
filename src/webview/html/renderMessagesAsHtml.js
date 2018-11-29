/* @flow strict-local */
import type { Narrow, RenderedMessages } from '../../types';
import type { BackgroundData } from '../MessageList';

import messageAsHtml from './messageAsHtml';
import messageHeaderAsHtml from './messageHeaderAsHtml';
import timeRowAsHtml from './timeRowAsHtml';

export default (
  backgroundData: BackgroundData,
  narrow: Narrow,
  renderedMessages: RenderedMessages,
): string => {
  const pieces = [];
  renderedMessages.forEach(item => {
    if (item.type === 'time') {
      pieces.push(timeRowAsHtml(item.timestamp, item.firstMessage));
    } else if (item.type === 'recipient_bar') {
      pieces.push(messageHeaderAsHtml(backgroundData, narrow, item));
    } else {
      pieces.push(messageAsHtml(backgroundData, item.message, item.isBrief));
    }
  });
  return pieces.join('');
};
