/* @flow strict-local */
// $FlowFixMe[untyped-import]
import union from 'lodash.union';
import Immutable from 'immutable';

import type { NarrowsState, PerAccountApplicableAction } from '../types';
import { ensureUnreachable } from '../types';
import {
  REGISTER_COMPLETE,
  LOGOUT,
  LOGIN_SUCCESS,
  ACCOUNT_SWITCH,
  MESSAGE_FETCH_START,
  MESSAGE_FETCH_ERROR,
  MESSAGE_FETCH_COMPLETE,
  EVENT_NEW_MESSAGE,
  EVENT_MESSAGE_DELETE,
  EVENT_UPDATE_MESSAGE_FLAGS,
  EVENT_UPDATE_MESSAGE,
} from '../actionConstants';
import { LAST_MESSAGE_ANCHOR, FIRST_UNREAD_ANCHOR } from '../anchor';
import {
  getNarrowsForMessage,
  MENTIONED_NARROW_STR,
  STARRED_NARROW_STR,
  isSearchNarrow,
  keyFromNarrow,
  topicNarrow,
  streamNarrow,
} from '../utils/narrow';
import { getKnownRangeForNarrow } from './narrowsSelectors';
import { getMessages } from '../directSelectors';

const initialState: NarrowsState = Immutable.Map();

function removeMessages(state: NarrowsState, narrow, messageIds): NarrowsState {
  return state.update(
    keyFromNarrow(narrow),
    messages => messages && messages.filter(id => !messageIds.has(id)),
  );
}

/**
 * Incorporate possibly old, possibly discontiguous, messages in the narrow.
 *
 * This differs from the MESSAGE_FETCH_COMPLETE case in that we aren't
 * assured that the messages listed are a contiguous segment of the full
 * list of messages in the narrow.  (For example, someone may have merged
 * one conversation into another, where some messages already in the
 * destination conversation fall in between some of the moved messages.)
 */
// We need to maintain the state.narrows invariant -- the fact that the
// message IDs we have in a narrow should be a contiguous segment of the
// full list of messages that actually exist in the narrow.  That can
// prevent us from adding the messages to our record of the narrow, and
// force us to instead downgrade how much we think we know about the narrow.
function addMessages(
  state: NarrowsState,
  narrow,
  messageIds,
  globalState: PerAccountState,
): NarrowsState {
  // NOTE: This behavior must stay parallel with how the caughtUp reducer
  //   handles the same cases.
  const key = keyFromNarrow(narrow);

  // First: if the state at the narrow covers any of the given messages,
  // then we can incorporate those and know the result is still contiguous.
  const [knownStart, knownEnd] = getKnownRangeForNarrow(globalState, narrow);
  const interiorIds = messageIds.filter(id => knownStart <= id && id <= knownEnd);
  console.log(
    `narrow addMessages at ${key}: known [${knownStart}, ${knownEnd}]; got ${messageIds.length}, of which ${interiorIds.length} interior`,
  );
  if (interiorIds.length === 0) {
    return state;
  }

  // ... Though that only works if we actually have those messages.  If not,
  // we can't put them in `state.narrows`, so we'll have to lose part of our
  // range.
  //
  // In principle we have a choice whether to keep the existing messages
  // that are older than all the new ones, or those that are newer.  To keep
  // things simple, always keep the older.
  const messages = getMessages(globalState);
  // We're counting here on messageIds (and so on `action.event.message_ids`)
  // being sorted.
  const firstMissing = interiorIds.findIndex(id => !messages.has(id));
  if (firstMissing < 0) {
    // Great, all the affected messages (that are in the already-known
    // range) are messages we have.  We can put them straight into the
    // narrow record.
    return state.update(
      key,
      existing => existing && [...existing, ...interiorIds].sort((a, b) => a - b),
    );
  } else {
    // Some are missing.
    const cutoff = interiorIds[firstMissing];
    const existing = state.get(key) ?? [];
    const combined = [
      ...existing.filter(id => id < cutoff),
      ...interiorIds.slice(0, firstMissing),
    ].sort((a, b) => a - b);
    return combined.length > 0 ? state.set(key, combined) : state.delete(key);

    // NOTE: In caughtUp we need to unset `newer`.  Also `older` if we ended
    //   up having no messages left, which happens if (a) we were caught up
    //   in the `older` direction, (b) some of these messages were older
    //   than any we had in the narrow, and (c) the oldest of those is one
    //   we don't have message data for.
  }

  // If not, though, then forget about them.  In particular, if we know
  // nothing about the target narrow, we'll continue to know nothing.
  //
  // This includes (the topic narrow in) the typical case of a topic edit or
  // stream move, where we know nothing about the target because this is the
  // first time anyone's used that topic.
  //
  // TODO: If the state at a *parent* narrow -- in particular the stream
  //   narrow, if this is a topic narrow -- covers the given messages, then
  //   use that.
}

const messageFetchComplete = (state, action) => {
  // We don't want to accumulate old searches that we'll never need again.
  if (isSearchNarrow(action.narrow)) {
    return state;
  }
  const key = keyFromNarrow(action.narrow);
  const fetchedMessageIds = action.messages.map(message => message.id);
  const replaceExisting =
    action.anchor === FIRST_UNREAD_ANCHOR || action.anchor === LAST_MESSAGE_ANCHOR;
  return state.set(
    key,
    replaceExisting
      ? fetchedMessageIds
      : union(state.get(key), fetchedMessageIds).sort((a, b) => a - b),
  );
};

const eventNewMessage = (state, action) => {
  const { message } = action;
  const { flags } = message;

  if (!flags) {
    throw new Error('EVENT_NEW_MESSAGE message missing flags');
  }

  return state.withMutations(stateMutable => {
    const narrowsForMessage = getNarrowsForMessage(message, action.ownUserId, flags);

    narrowsForMessage.forEach(narrow => {
      const key = keyFromNarrow(narrow);
      const value = stateMutable.get(key);

      if (!value) {
        // We haven't loaded this narrow. The time to add a new key
        // isn't now; we do that in MESSAGE_FETCH_COMPLETE, when we
        // might have a reasonably long, contiguous list of messages
        // to show.
        return; // i.e., continue
      }

      // (No guarantee that `key` is in `action.caughtUp`)
      // flowlint-next-line unnecessary-optional-chain:off
      if (!action.caughtUp[key]?.newer) {
        // Don't add a message to the end of the list unless we know
        // it's the most recent message, i.e., unless we know we're
        // currently looking at (caught up with) the newest messages
        // in the narrow. We don't want to accidentally show a message
        // at the end of a message list if there might be messages
        // between the currently latest-shown message and this
        // message.
        //
        // See a corresponding condition in messagesReducer, where we
        // don't bother to add to `state.messages` if this condition
        // (after running on all of `narrowsForMessage`) means the new
        // message wasn't added anywhere in `state.narrows`.
        return; // i.e., continue
      }

      if (value.some(id => action.message.id === id)) {
        // Don't add a message that's already been added. It's probably
        // very rare for a message to have already been added when we
        // get an EVENT_NEW_MESSAGE, and perhaps impossible. (TODO:
        // investigate?)
        return; // i.e., continue
      }

      // If changing or removing a case where we ignore a message
      // here: Careful! Every message in `state.narrows` must exist in
      // `state.messages`. If we choose to include a message in
      // `state.narrows`, then messagesReducer MUST ALSO choose to
      // include it in `state.messages`.

      stateMutable.set(key, [...value, message.id]);
    });
  });
};

const eventMessageDelete = (state, action) => {
  let stateChange = false;
  const newState = state.map((value, key) => {
    const result = value.filter(id => !action.messageIds.includes(id));
    stateChange = stateChange || result.length < value.length;
    return result;
  });
  return stateChange ? newState : state;
};

const updateFlagNarrow = (state, narrowStr, op, messageIds): NarrowsState => {
  const value = state.get(narrowStr);
  if (!value) {
    return state;
  }
  switch (op) {
    case 'add': {
      return state.set(
        narrowStr,
        [...value, ...messageIds].sort((a, b) => a - b),
      );
    }
    case 'remove': {
      const messageIdSet = new Set(messageIds);
      return state.set(
        narrowStr,
        value.filter(id => !messageIdSet.has(id)),
      );
    }
    default:
      ensureUnreachable(op);
      throw new Error(`Unexpected operation ${op} in an EVENT_UPDATE_MESSAGE_FLAGS action`);
  }
};

const eventUpdateMessageFlags = (state, action) => {
  const { flag, op, messages: messageIds } = action;
  if (flag === 'starred') {
    return updateFlagNarrow(state, STARRED_NARROW_STR, op, messageIds);
  } else if (['mentioned', 'wildcard_mentioned'].includes(flag)) {
    return updateFlagNarrow(state, MENTIONED_NARROW_STR, op, messageIds);
  }
  return state;
};

export default (
  state: NarrowsState = initialState,
  action: PerAccountApplicableAction,
): NarrowsState => {
  switch (action.type) {
    case REGISTER_COMPLETE:
    case LOGOUT:
    case LOGIN_SUCCESS:
    case ACCOUNT_SWITCH:
      return initialState;

    case MESSAGE_FETCH_START: {
      // We don't want to accumulate old searches that we'll never need again.
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
      return messageFetchComplete(state, action);
    }

    case EVENT_NEW_MESSAGE:
      return eventNewMessage(state, action);

    case EVENT_MESSAGE_DELETE:
      return eventMessageDelete(state, action);

    case EVENT_UPDATE_MESSAGE: {
      // Compare the corresponding caughtUpReducer case.

      let result: NarrowsState = state;
      const { event, move } = action;

      if (move) {
        // The edit changed topic and/or stream.
        const { orig_stream_id, orig_topic, new_stream_id, new_topic } = move;
        const messageIdSet = new Set(event.message_ids);
        result = addMessages(
          result,
          topicNarrow(new_stream_id, new_topic),
          event.message_ids,
          globalState,
        );
        result = removeMessages(result, topicNarrow(orig_stream_id, orig_topic), messageIdSet);
        if (new_stream_id !== orig_stream_id) {
          result = addMessages(result, streamNarrow(new_stream_id), event.message_ids, globalState);
          result = removeMessages(result, streamNarrow(orig_stream_id), messageIdSet);
        }
      }

      // We don't attempt to update search narrows.

      // The other way editing a message can affect what narrows it falls
      // into is by changing its flags.  Those cause a separate event; see
      // the EVENT_UPDATE_MESSAGE_FLAGS case.

      return result;
    }

    case EVENT_UPDATE_MESSAGE_FLAGS:
      return eventUpdateMessageFlags(state, action);

    default:
      return state;
  }
};
