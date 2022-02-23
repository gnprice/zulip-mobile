/* @flow strict-local */
import type { CaughtUpState, PerAccountApplicableAction, PerAccountState } from '../types';
import {
  REGISTER_COMPLETE,
  LOGOUT,
  LOGIN_SUCCESS,
  ACCOUNT_SWITCH,
  MESSAGE_FETCH_START,
  MESSAGE_FETCH_ERROR,
  MESSAGE_FETCH_COMPLETE,
  EVENT_UPDATE_MESSAGE,
  EVENT_UPDATE_MESSAGE_FLAGS,
} from '../actionConstants';
import { NULL_OBJECT } from '../nullObjects';
import { DEFAULT_CAUGHTUP } from './caughtUpSelectors';
import { isSearchNarrow, keyFromNarrow, streamNarrow, topicNarrow } from '../utils/narrow';
import { getAllNarrows, getMessages } from '../directSelectors';

const initialState: CaughtUpState = NULL_OBJECT;

/** Corresponds to the same-name function in the narrows reducer. */
function addMessages(
  state: CaughtUpState,
  narrow,
  messageIds,
  globalState: PerAccountState,
): CaughtUpState {
  // NOTE: This behavior must stay parallel with how the narrows reducer
  //   handles the same cases.
  // See narrowsReducer.js for discussion.

  // If we weren't caught up in a given direction, then we still aren't:
  // there may be any number of messages there that we don't know about.
  // (Possibly including some of these messages, because the narrows reducer
  // won't have recorded them if they lay beyond the known-contiguous range
  // of messages we already had.)

  // But if we *were* caught up, then we may no longer be.  This can happen
  // if any of the moved messages is one that's missing from
  // `state.messages`, because then we can't keep that message in our
  // `state.narrows` list for the narrow, and so our interval of
  // completeness can't span that message.  Specifically,
  //
  //  * For `newer`: If any message is missing, we set `newer: false`.  This
  //    is because in the narrows reducer, we choose to keep the early part
  //    of our interval of completeness, rather than the later part.
  //
  //  * For `older`: If the oldest of the messages is missing, and is older
  //    than all the messages we have in the narrow's list, then we set
  //    `older: false`.

  const key = keyFromNarrow(narrow);
  let { older, newer } = state[key] || DEFAULT_CAUGHTUP;
  console.log(`caughtUp addMessages at ${key}: was ${older}/${newer}`);
  if (!older && !newer) {
    console.log('caughtUp addMessages: ..... not caught up, nothing to do');
    return state;
  }

  const messages = getMessages(globalState);
  const firstMissing = messageIds.findIndex(id => !messages.has(id));
  if (firstMissing < 0) {
    // All messages were known, so we got to maintain our interval of
    // completeness.
    console.log('caughtUp addMessages: ..... all messages known, nothing to do');
    return state;
  } else {
    // Some are missing.
    newer = false;
    console.log(`caughtUp addMessages: ..... unknown message at ${firstMissing}`);
    if (older && firstMissing === 0) {
      // This is the *old* narrows state, from before this action.  (If it
      // were the new one, this could be a bit simpler: we'd clear `older`
      // just if there was a missing message ID and the narrows list is now
      // empty.)
      const narrowList = getAllNarrows(globalState).get(key);
      console.log(`caughtUp addMessages: ........ and narrow had ${narrowList?.length ?? 0}`);
      if (!narrowList || narrowList.length === 0 || messageIds[firstMissing] < narrowList[0]) {
        console.log('caughtUp addMessages: ........... clearing older');
        older = false;
      }
    }
    console.log(`caughtUp addMessages: ..... result ${older}/${newer}`);
    return { ...state, [key]: { older, newer } };
  }

  // TODO: There's a case here that, although this reducer itself handles it
  //   correctly, we don't go on to properly act on.
  //
  //   Suppose we're looking at a conversation, caught up both ways (as we
  //   will be if it's short.)  Then someone merges some other conversation
  //   into it, in which at least the oldest message is one we don't have,
  //   and is older than any of the messages already there.
  //
  //   We'll forget the narrow's whole message list, and then correctly set
  //   caughtUp to false/false.  This means we don't know what's in the
  //   narrow.
  //
  //   However: the existing ChatScreen that's showing the conversation
  //   won't correctly update.  It will switch to saying there's no messages
  //   (which isn't right -- the truth is we don't know what messages there
  //   might be), and will not attempt any fetching.  The user must navigate
  //   out and come back.
  //
  //   The basic cause of this is that we have two ways of fetching more
  //   from ChatScreen, forming a bit of a patchwork, and neither covers this:
  //    * We call fetchOlder and fetchNewer on scroll of MessageList.  These
  //      duly check caughtUp to decide if they need to do anything.  But
  //      when showing the "No messages" message, we have no MessageList, so
  //      there's no way to trigger those.  (Even if there were, they only
  //      act when there's already at least one message.)
  //    * From ChatScreen itself, we fetch on first mount and when the event
  //      queue changes.  But we don't consult caughtUp, so we don't notice
  //      if it turns to false.
}

export default (
  state: CaughtUpState = initialState,
  action: PerAccountApplicableAction,
  globalState: PerAccountState,
): CaughtUpState => {
  switch (action.type) {
    case REGISTER_COMPLETE:
    case LOGOUT:
    case LOGIN_SUCCESS:
    case ACCOUNT_SWITCH:
      return initialState;

    case MESSAGE_FETCH_START: {
      // We don't want to accumulate old searches that we'll never
      // need again.
      if (isSearchNarrow(action.narrow)) {
        return state;
      }
      // Currently this whole case could be subsumed in `default`. But
      // we don't want to add this case with something else in mind,
      // later, and forget about the search-narrow check above.
      return state;
    }

    /**
     * The reverse of MESSAGE_FETCH_START, for cleanup.
     */
    case MESSAGE_FETCH_ERROR: {
      return state;
    }

    case MESSAGE_FETCH_COMPLETE: {
      // We don't want to accumulate old searches that we'll never need again.
      if (isSearchNarrow(action.narrow)) {
        return state;
      }
      const key = keyFromNarrow(action.narrow);
      const { older: prevOlder, newer: prevNewer } = state[key] || DEFAULT_CAUGHTUP;
      return {
        ...state,
        [key]: {
          older: prevOlder || action.foundOldest,
          newer: prevNewer || action.foundNewest,
        },
      };
    }

    case EVENT_UPDATE_MESSAGE: {
      // Compare the corresponding narrowsReducer case.

      let result = state;
      const { event, move } = action;

      if (move) {
        const { orig_stream_id, new_stream_id, new_topic } = move;
        result = addMessages(
          result,
          topicNarrow(new_stream_id, new_topic),
          event.message_ids,
          globalState,
        );
        if (new_stream_id !== orig_stream_id) {
          result = addMessages(result, streamNarrow(new_stream_id), event.message_ids, globalState);
        }
        // TODO(#3408): Also update the old narrow.  That's rare: it only
        //   applies if (a) we were caught up in exactly one direction, and
        //   (b) all the messages we had in the narrow were moved.
        //   Typically (a) won't hold unless there are more messages than
        //   we'd fetch at once; and then that's a lot of messages, so it's
        //   unlikely they'd all be moved.
      }

      // We don't attempt to update search narrows.

      // The other way editing a message can affect what narrows it falls
      // into is by changing its flags.  Those cause a separate event; see
      // the EVENT_UPDATE_MESSAGE_FLAGS case.

      return result;
    }

    case EVENT_UPDATE_MESSAGE_FLAGS:
      // TODO(#3408): Handle this to parallel narrowsReducer.
      return state;

    default:
      return state;
  }
};
