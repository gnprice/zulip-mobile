import deepFreeze from 'deep-freeze';
import { keyFromNarrow, topicNarrow } from '../../utils/narrow';

import { getDraftForNarrow } from '../draftsSelectors';

describe('getDraftForNarrow', () => {
  test('return content of draft if exists', () => {
    const narrow = topicNarrow('stream', 'topic');
    const state = deepFreeze({
      drafts: {
        [keyFromNarrow(narrow)]: 'content',
      },
    });

    const draft = getDraftForNarrow(state, narrow);

    expect(draft).toEqual('content');
  });

  test('return empty string if not exists', () => {
    const narrow = topicNarrow('stream', 'topic');
    const state = deepFreeze({
      drafts: {
        [keyFromNarrow(narrow)]: 'content',
      },
    });

    const draft = getDraftForNarrow(state, topicNarrow('stream', 'topic1'));

    expect(draft).toEqual('');
  });
});
