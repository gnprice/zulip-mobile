/* @flow strict-local */
import { keyFromNarrow } from "../../utils/narrow.js";
import type { MessageListEvent } from '../webViewEventHandlers';

export default (msg: MessageListEvent) => {
  window.ReactNativeWebView.postMessage(keyFromNarrow(msg));
};
