/* @flow strict-local */
import type { Action, Dimensions, Orientation } from '../types';
import {
  APP_ONLINE,
  APP_ORIENTATION,
  APP_STATE,
  DEAD_QUEUE,
  DEBUG_FLAG_TOGGLE,
  INIT_SAFE_AREA_INSETS,
  CANCEL_EDIT_MESSAGE,
  START_EDIT_MESSAGE,
} from '../actionConstants';
import { withApi } from '../apiReduxThunk';

export const appOnline = (isOnline: boolean): Action => ({
  type: APP_ONLINE,
  isOnline,
});

export const appState = (isActive: boolean): Action => ({
  type: APP_STATE,
  isActive,
});

export const deadQueue = (): Action => ({
  type: DEAD_QUEUE,
});

export const initSafeAreaInsets = (safeAreaInsets: Dimensions): Action => ({
  type: INIT_SAFE_AREA_INSETS,
  safeAreaInsets,
});

export const appOrientation = (orientation: Orientation): Action => ({
  type: APP_ORIENTATION,
  orientation,
});

export const startEditMessage = (messageId: number, topic: string) =>
  withApi(async (api, auth, dispatch) => {
    const { raw_content } = await api.getRawMessageContent(auth, messageId);
    dispatch({
      type: START_EDIT_MESSAGE,
      messageId,
      message: raw_content,
      topic,
    });
  });

export const cancelEditMessage = (): Action => ({
  type: CANCEL_EDIT_MESSAGE,
});

export const debugFlagToggle = (key: string, value: boolean): Action => ({
  type: DEBUG_FLAG_TOGGLE,
  key,
  value,
});
