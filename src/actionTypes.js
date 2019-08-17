/* @flow strict-local */
import type { NavigationNavigateAction } from 'react-navigation';

import {
  REHYDRATE,
  APP_ONLINE,
  APP_STATE,
  DEAD_QUEUE,
  INIT_SAFE_AREA_INSETS,
  APP_ORIENTATION,
  START_EDIT_MESSAGE,
  CANCEL_EDIT_MESSAGE,
  DEBUG_FLAG_TOGGLE,
  ACCOUNT_SWITCH,
  REALM_ADD,
  ACCOUNT_REMOVE,
  LOGIN_SUCCESS,
  LOGOUT,
  REALM_INIT,
  GOT_PUSH_TOKEN,
  UNACK_PUSH_TOKEN,
  ACK_PUSH_TOKEN,
  MESSAGE_FETCH_START,
  MESSAGE_FETCH_COMPLETE,
  INITIAL_FETCH_START,
  INITIAL_FETCH_COMPLETE,
  SETTINGS_CHANGE,
  DRAFT_UPDATE,
  DO_NARROW,
  PRESENCE_RESPONSE,
  MESSAGE_SEND_START,
  MESSAGE_SEND_COMPLETE,
  DELETE_OUTBOX_MESSAGE,
  TOGGLE_OUTBOX_SENDING,
  EVENT_MESSAGE_DELETE,
  EVENT_USER_GROUP_ADD,
  EVENT_USER_GROUP_REMOVE,
  EVENT_USER_GROUP_UPDATE,
  EVENT_USER_GROUP_ADD_MEMBERS,
  EVENT_USER_GROUP_REMOVE_MEMBERS,
  EVENT_USER_STATUS_UPDATE,
  EVENT_TYPING_START,
  EVENT_TYPING_STOP,
  EVENT_NEW_MESSAGE,
  EVENT_REACTION_ADD,
  EVENT_REACTION_REMOVE,
  EVENT_PRESENCE,
  EVENT_UPDATE_GLOBAL_NOTIFICATIONS_SETTINGS,
  EVENT_UPDATE_MESSAGE,
  EVENT_UPDATE_MESSAGE_FLAGS,
  EVENT_USER_ADD,
  CLEAR_TYPING,
  EVENT_ALERT_WORDS,
  INIT_TOPICS,
  EVENT_MUTED_TOPICS,
  EVENT_REALM_FILTERS,
  EVENT_USER_REMOVE,
  EVENT_USER_UPDATE,
  EVENT_REALM_EMOJI_UPDATE,
  EVENT_UPDATE_DISPLAY_SETTINGS,
  EVENT_SUBMESSAGE,
  EVENT_SUBSCRIPTION,
  EVENT,
} from './actionConstants';

import type { MessageEvent, PresenceEvent, StreamEvent, SubmessageEvent } from './api/eventTypes';

import type {
  Dimensions,
  Orientation,
  GlobalState,
  Message,
  Outbox,
  Narrow,
  Reaction,
  Identity,
  User,
  UserGroup,
  InitialData,
  RealmFilter,
  Subscription,
  Topic,
  RealmEmojiById,
  UserStatusEvent,
} from './types';

/**
 * Dispatched by redux-persist when the stored state is loaded.
 *
 * It can be very convenient to pass `payload` to selectors, but beware it's
 * incomplete.  At a minimum, reducers should always separately handle the
 * case where the state is empty or has `null` properties before passing the
 * object to any selector.
 *
 * @prop payload A version of the global Redux state, as persisted by the
 *     app's previous runs.  This will be empty on first startup or if the
 *     persisted store is just missing keys, and will have `null` at each
 *     key where an error was encountered in reading the persisted store.
 *     In any case it will only contain the keys we configure to be persisted.
 * @prop error
 */
type RehydrateAction = {|
  type: typeof REHYDRATE,
  payload: GlobalState | { accounts: null } | {||} | void,
  error: mixed,
|};

export type NavigateAction = NavigationNavigateAction;

type AccountRemoveAction = {|
  type: typeof ACCOUNT_REMOVE,
  index: number,
|};

type LoginSuccessAction = {|
  type: typeof LOGIN_SUCCESS,
  realm: string,
  email: string,
  apiKey: string,
|};


//
// The `Action` union type.
//

type AccountAction =
  | AccountRemoveAction
    | LoginSuccessAction;

type SessionAction =
    | RehydrateAction;

/** Covers all actions we ever `dispatch`. */
// The grouping here is completely arbitrary; don't worry about it.
export type Action =
  | AccountAction
    | SessionAction;
