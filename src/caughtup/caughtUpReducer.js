/* @flow strict-local */
import type { CaughtUpState, PerAccountApplicableAction } from '../types';
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

const initialState: CaughtUpState = NULL_OBJECT;

/** Corresponds to the same-name function in the narrows reducer. */
function addMessages(state: CaughtUpState, narrow, messageIds): CaughtUpState {
  // NOTE: This behavior must stay parallel with how the narrows reducer
  //   handles the same cases.
  // See narrowsReducer.js for discussion.

  // If we weren't caught up in a given direction, then we still aren't:
  // there may be any number of messages there that we don't know about.
  // (Possibly including some of these messages, because the narrows reducer
  // won't have recorded them if they lay beyond the known-contiguous range
  // of messages we already had.)
  //
  // If we were caught up, that means that before this event there weren't
  // any messages in that direction which we didn't know about; and for any
  // of these messages that lay in that direction, the narrows reducer added
  // them to the narrows state.  So we once again know about the endmost
  // messages in that direction, i.e. we are still caught up.
  //
  // Either way, the caught-up state doesn't change.
  return state;
}

export default (
  state: CaughtUpState = initialState,
  action: PerAccountApplicableAction,
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
        result = addMessages(result, topicNarrow(new_stream_id, new_topic), event.message_ids);
        if (new_stream_id !== orig_stream_id) {
          result = addMessages(result, streamNarrow(new_stream_id), event.message_ids);
        }
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
