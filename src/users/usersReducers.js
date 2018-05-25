/* @flow */
import type {
  UsersState,
  UsersAction,
  InitUsersAction,
  RealmInitAction,
  EventUserAddAction,
} from '../types';
import {
  LOGOUT,
  LOGIN_SUCCESS,
  ACCOUNT_SWITCH,
  INIT_USERS,
  REALM_INIT,
  EVENT_USER_ADD,
  EVENT_USER_REMOVE,
  EVENT_USER_UPDATE,
} from '../actionConstants';
import { NULL_ARRAY } from '../nullObjects';

const initialState: UsersState = NULL_ARRAY;

const initUsers = (state: UsersState, action: InitUsersAction): UsersState =>
  action.users;

const realmInit = (state: UsersState, action: RealmInitAction): UsersState =>
  action.data.realm_users;

const eventUserAdd = (
  state: UsersState,
  action: EventUserAddAction,
): UsersState => [...state, action.person];

export default (
  state: UsersState = initialState,
  action: UsersAction,
): UsersState => {
  switch (action.type) {
    case LOGOUT:
    case LOGIN_SUCCESS:
    case ACCOUNT_SWITCH:
      return initialState;

    case INIT_USERS:
      return initUsers(state, action);

    case REALM_INIT:
      return realmInit(state, action);

    case EVENT_USER_ADD:
      return eventUserAdd(state, action);

    case EVENT_USER_REMOVE:
      return state; // TODO

    case EVENT_USER_UPDATE:
      return state; // TODO

    default:
      return state;
  }
};
