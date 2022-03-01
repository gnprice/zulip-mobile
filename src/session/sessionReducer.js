/* @flow strict-local */
import type { GlobalState, Action } from '../reduxTypes';
import type { SessionState } from './sessionModelCore';
import {
  REHYDRATE,
  DEAD_QUEUE,
  LOGIN_SUCCESS,
  APP_ONLINE,
  ACCOUNT_SWITCH,
  REGISTER_START,
  REGISTER_ABORT,
  REGISTER_COMPLETE,
  APP_ORIENTATION,
  TOGGLE_OUTBOX_SENDING,
  DEBUG_FLAG_TOGGLE,
  GOT_PUSH_TOKEN,
  LOGOUT,
  DISMISS_SERVER_COMPAT_NOTICE,
} from '../actionConstants';
import { getHasAuth } from '../account/accountsSelectors';

const initialState: SessionState = {
  eventQueueId: null,

  // This will be `null` on startup, while we wait to hear `true` or `false`
  // from the native module over the RN bridge; so, have it start as `null`.
  isOnline: null,

  isHydrated: false,
  loading: false,
  needsInitialFetch: false,
  orientation: 'PORTRAIT',
  outboxSending: false,
  pushToken: null,
  debug: Object.freeze({}),
  hasDismissedServerCompatNotice: false,
};

const rehydrate = (state, action) => {
  const { payload } = action;

  /* $FlowIgnore[incompatible-cast]: The actual type allows any property to
       be missing; narrow that to just the one that `getHasAuth` will care
       about.  (What we really want here is what the value of `getHasAuth`
       will be after the rehydrate is complete.  So even if some other
       property is missing in the payload, we still do want to ask
       `getHasAuth` what it thinks.)

       (Also pretend that the property would be void, rather than missing,
       because Flow doesn't seem to do refinements on whether an optional
       property is present.) */
  const payloadForGetHasAuth = (payload: GlobalState | { accounts: void, ... });
  const haveApiKey = !!payloadForGetHasAuth.accounts && getHasAuth(payloadForGetHasAuth);

  return {
    ...state,
    isHydrated: true,
    // On rehydration, do an initial fetch if we have access to an account
    // (indicated by the presence of an api key). Otherwise, the initial fetch
    // will be initiated on loginSuccess.
    // NB `getInitialRouteInfo` depends intimately on this behavior.
    needsInitialFetch: haveApiKey,
  };
};

export default (state: SessionState = initialState, action: Action): SessionState => {
  switch (action.type) {
    case DEAD_QUEUE:
      return {
        ...state,
        needsInitialFetch: true,
        loading: false,
      };

    case LOGIN_SUCCESS:
      return {
        ...state,
        needsInitialFetch: true,
      };

    case LOGOUT:
      return {
        ...state,
        needsInitialFetch: false,
        loading: false,
      };

    case ACCOUNT_SWITCH:
      return {
        ...state,
        needsInitialFetch: true,
        loading: false,
      };

    case REHYDRATE:
      return rehydrate(state, action);

    case REGISTER_COMPLETE:
      return {
        ...state,
        loading: false,
        needsInitialFetch: false,
        eventQueueId: action.data.queue_id,
      };

    case APP_ONLINE:
      return {
        ...state,
        isOnline: action.isOnline,
      };

    case REGISTER_START:
      return {
        ...state,
        loading: true,
      };

    case REGISTER_ABORT:
      return {
        ...state,
        loading: false,
        needsInitialFetch: false,
      };

    case APP_ORIENTATION:
      return {
        ...state,
        orientation: action.orientation,
      };

    case GOT_PUSH_TOKEN:
      return {
        ...state,
        pushToken: action.pushToken,
      };

    case TOGGLE_OUTBOX_SENDING:
      return { ...state, outboxSending: action.sending };

    case DEBUG_FLAG_TOGGLE:
      return {
        ...state,
        debug: {
          ...state.debug,
          [action.key]: action.value,
        },
      };

    case DISMISS_SERVER_COMPAT_NOTICE:
      return {
        ...state,
        hasDismissedServerCompatNotice: true,
      };

    default:
      return state;
  }
};
