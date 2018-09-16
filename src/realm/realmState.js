/* @flow */
import type { RealmAction, RealmBot, RealmEmojiState, RealmFilter, User } from '../types';
import {
  ACCOUNT_SWITCH,
  DELETE_TOKEN_PUSH,
  EVENT_REALM_EMOJI_UPDATE,
  EVENT_REALM_FILTER_UPDATE,
  EVENT_UPDATE_DISPLAY_SETTINGS,
  INIT_REALM_EMOJI,
  INIT_REALM_FILTER,
  LOGIN_SUCCESS,
  LOGOUT,
  REALM_INIT,
  SAVE_TOKEN_PUSH,
} from '../actionConstants';

/**
 * State with general info about a Zulip organization; our state subtree `realm`.
 *
 * @prop twentyFourHourTime
 * @prop canCreateStreams
 * @prop crossRealmBots - The server's cross-realm bots; e.g., Welcome Bot.
 *   Cross-realm bots should be treated like normal bots.
 * @prop nonActiveUsers - All users in the organization with `is_active`
 *   false; for normal users, this means they or an admin deactivated their
 *   account.  See `User` and the linked documentation.
 * @prop pushToken
 * @prop filters
 * @prop emoji
 * @prop isAdmin
 */
export type RealmState = {
  twentyFourHourTime: boolean,
  canCreateStreams: boolean,
  crossRealmBots: RealmBot[],
  nonActiveUsers: User[],
  pushToken: {
    token: string,
    msg: string,
    result: string,
  },
  filters: RealmFilter[],
  emoji: RealmEmojiState,
  isAdmin: boolean,
};

// Initial state
const initialState = {
  canCreateStreams: true,
  crossRealmBots: [],
  twentyFourHourTime: false,
  pushToken: { token: '', result: '', msg: '' },
  emoji: {},
  filters: [],
  isAdmin: false,
  nonActiveUsers: [],
};

export const reducer = (state: RealmState = initialState, action: RealmAction): RealmState => {
  switch (action.type) {
    case ACCOUNT_SWITCH:
      return initialState;

    case REALM_INIT:
      return {
        ...state,
        canCreateStreams: action.data.can_create_streams,
        crossRealmBots: action.data.cross_realm_bots,
        emoji: action.data.realm_emoji,
        filters: action.data.realm_filters,
        isAdmin: action.data.is_admin,
        nonActiveUsers: action.data.realm_non_active_users,
        twentyFourHourTime: action.data.twenty_four_hour_time,
      };

    case SAVE_TOKEN_PUSH:
      return {
        ...state,
        pushToken: {
          token: action.pushToken,
          result: action.result,
          msg: action.msg,
        },
      };

    case DELETE_TOKEN_PUSH:
      return {
        ...state,
        pushToken: { token: '', result: '', msg: '' },
      };

    case LOGOUT:
    case LOGIN_SUCCESS:
      return {
        ...state,
        emoji: {},
        pushToken: { token: '', result: '', msg: '' },
      };

    case INIT_REALM_EMOJI:
      return {
        ...state,
        emoji: action.emojis,
      };

    case INIT_REALM_FILTER:
      return {
        ...state,
        filters: action.filters,
      };

    case EVENT_REALM_FILTER_UPDATE:
      return {
        ...state,
        filters: action.realm_filters,
      };

    case EVENT_REALM_EMOJI_UPDATE:
      return {
        ...state,
        emoji: action.realm_emoji,
      };

    case EVENT_UPDATE_DISPLAY_SETTINGS:
      switch (action.setting_name) {
        case 'twenty_four_hour_time':
          return { ...state, twentyFourHourTime: action.setting };
        default:
          return state;
      }

    default:
      return state;
  }
};
