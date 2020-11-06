/* @flow strict-local */
import type { Narrow, RenderedSectionDescriptor } from '../../types';
import type { BackgroundData } from '../MessageList';

import messageAsHtml from './messageAsHtml';
import messageHeaderAsHtml from './messageHeaderAsHtml';
import timeRowAsHtml from './timeRowAsHtml';

export default (
  backgroundData: BackgroundData,
  narrow: Narrow,
  renderedMessages: RenderedSectionDescriptor[],
): string => {
  const pieces = [];

  for (const section of renderedMessages) {
    pieces.push(messageHeaderAsHtml(backgroundData, narrow, section.message));

    for (const item of section.data) {
      if (item.type === 'time') {
        pieces.push(timeRowAsHtml(item.timestamp, item.firstMessage));
      } else {
        pieces.push(messageAsHtml(backgroundData, item.message, item.isBrief));
      }
    }
  }

  return pieces.join('');
};
