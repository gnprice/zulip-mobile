/* @flow strict-local */
import React from 'react';
import { View } from 'react-native';
import type { NavigationStackProp, NavigationStateRoute } from 'react-navigation-stack';
import { withNavigationFocus } from 'react-navigation';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { useDispatch } from 'react-redux';
import { compose } from 'redux';

import styles, { createStyleSheet, ThemeContext } from '../styles';
import type { Dispatch, Fetching, Narrow, EditMessage } from '../types';
import { KeyboardAvoider, OfflineNotice, ZulipStatusBar } from '../common';
import ChatNavBar from '../nav/ChatNavBar';
import MessageList from '../webview/MessageList';
import NoMessages from '../message/NoMessages';
import FetchError from './FetchError';
import InvalidNarrow from './InvalidNarrow';
import { fetchMessagesInNarrow } from '../message/fetchActions';
import ComposeBox from '../compose/ComposeBox';
import UnreadNotice from './UnreadNotice';
import { canSendToNarrow } from '../utils/narrow';
import { getLoading, getSession } from '../directSelectors';
import { getFetchingForNarrow } from './fetchingSelectors';
import { getShownMessagesForNarrow, isNarrowValid as getIsNarrowValid } from './narrowsSelectors';
import { connect } from '../react-redux';

type SelectorProps = {|
  isNarrowValid: boolean,
  fetching: Fetching,
  haveNoMessages: boolean,
  loading: boolean,
  eventQueueId: number,
|};

type Props = $ReadOnly<{|
  // Since we've put this screen in a stack-nav route config, and we
  // don't invoke it without type-checking anywhere else (in fact, we
  // don't invoke it anywhere else at all), we know it gets the
  // `navigation` prop for free, with the stack-nav shape.
  navigation: NavigationStackProp<{| ...NavigationStateRoute, params: {| narrow: Narrow |} |}>,
  dispatch: Dispatch,

  // From React Navigation's `withNavigationFocus` HOC. Type copied
  // from the libdef.
  isFocused: ?boolean,

  ...SelectorProps,
|}>;

const componentStyles = createStyleSheet({
  screen: {
    flex: 1,
    flexDirection: 'column',
  },
});

/**
 * Fetch messages for this narrow and report an error, if any
 *
 * See `MessagesState` for background about the fetching, including
 * why this is nearly the only place where additional data fetching
 * is required.  See `fetchMessagesInNarrow` and `fetchMessages` for
 * more details, including how Redux is kept up-to-date during the
 * whole process.
 */
const useFetchMessages = args => {
  const { isFocused, narrow, eventQueueId, loading, fetching, haveNoMessages } = args;

  const dispatch: Dispatch = useDispatch();

  const isFetching = fetching.older || fetching.newer || loading;

  // This could live in state, but then we'd risk pointless rerenders;
  // we only use it in our `useEffect` callbacks. Using `useRef` is
  // like using instance variables in class components:
  //   https://reactjs.org/docs/hooks-faq.html#is-there-something-like-instance-variables
  const shouldFetchWhenNextFocused = React.useRef<boolean>(false);

  const [fetchError, setFetchError] = React.useState<Error | null>(null);

  const fetch = React.useCallback(async () => {
    shouldFetchWhenNextFocused.current = false;
    try {
      await dispatch(fetchMessagesInNarrow(narrow));
    } catch (e) {
      setFetchError(e);
    }
  }, [
    // Neither of these should change, but we include them for
    // correctness.
    dispatch,
    narrow,
  ]);

  // First `useEffect` (order matters).
  React.useEffect(
    () => {
      // When the event queue changes, schedule a fetch.
      shouldFetchWhenNextFocused.current = true;
    },
    // Don't add `isFocused` here: we only want to set
    // `shouldFetchWhenNextFocused` to true when the `eventQueueId`
    // changes, and not for any other reason. If we include
    // `isFocused`, then the callback might be firing because
    // `isFocused` changed, and we can't easily inspect previous
    // values of `eventQueueId` or `isFocused` to see if that's the
    // case
    // (https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state).
    [eventQueueId],
  );

  // Second `useEffect` (order matters)
  React.useEffect(() => {
    // Fetch on the first mount. Synchronously, unset
    // `shouldFetchWhenNextFocused.current` that was set in the
    // previous `useEffect`, so that only one fetch will be done on
    // first mount (i.e., prevent the fetch in the next `useEffect`).
    fetch();
  }, [
    // `fetch` will not change, but we include it for correctness.
    fetch,
  ]);

  // Third `useEffect` (order matters)
  React.useEffect(() => {
    if (shouldFetchWhenNextFocused.current && isFocused === true) {
      // Do a scheduled fetch, if it's time
      fetch();
    }
  }, [
    // Fetch (if needed) when the screen gains focus.
    isFocused,
    // In case the screen was already in focus when we got a new
    // `eventQueueId`. In that case, a previous `useEffect` will have
    // set `shouldFetchWhenNextFocused.current` to `true`.
    eventQueueId,
    // `fetch` will not change, but we include it for correctness.
    fetch,
  ]);

  return { fetchError, isFetching, haveNoMessages };
};

function ChatScreen(props: Props) {
  const { backgroundColor } = React.useContext(ThemeContext);

  const [editMessage, setEditMessage] = React.useState<EditMessage | null>(null);

  const { navigation } = props;
  const { narrow } = navigation.state.params;

  const { isNarrowValid } = props;

  const { fetchError, isFetching, haveNoMessages } = useFetchMessages({
    ...props,
    narrow,
  });

  const showMessagePlaceholders = haveNoMessages && isFetching;
  const sayNoMessages = haveNoMessages && !isFetching;
  const showComposeBox = canSendToNarrow(narrow) && !showMessagePlaceholders;

  return (
    <ActionSheetProvider>
      <View style={[componentStyles.screen, { backgroundColor }]}>
        <KeyboardAvoider style={styles.flexed} behavior="padding">
          <ZulipStatusBar narrow={narrow} />
          <ChatNavBar narrow={narrow} editMessage={editMessage} />
          <OfflineNotice />
          <UnreadNotice narrow={narrow} />
          {(() => {
            if (!isNarrowValid) {
              return <InvalidNarrow narrow={narrow} />;
            } else if (fetchError !== null) {
              return <FetchError narrow={narrow} error={fetchError} />;
            } else if (sayNoMessages) {
              return <NoMessages narrow={narrow} />;
            } else {
              return (
                <MessageList
                  narrow={narrow}
                  showMessagePlaceholders={showMessagePlaceholders}
                  startEditMessage={setEditMessage}
                />
              );
            }
          })()}
          {showComposeBox && (
            <ComposeBox
              narrow={narrow}
              editMessage={editMessage}
              completeEditMessage={() => setEditMessage(null)}
            />
          )}
        </KeyboardAvoider>
      </View>
    </ActionSheetProvider>
  );
}

export default compose(
  // https://reactnavigation.org/docs/4.x/function-after-focusing-screen/#triggering-an-action-with-the-withnavigationfocus-higher-order-component
  withNavigationFocus,
  connect<SelectorProps, _, _>((state, props) => {
    const { narrow } = props.navigation.state.params;
    return {
      isNarrowValid: getIsNarrowValid(state, narrow),
      loading: getLoading(state),
      fetching: getFetchingForNarrow(state, narrow),
      haveNoMessages: getShownMessagesForNarrow(state, narrow).length === 0,
      eventQueueId: getSession(state).eventQueueId,
    };
  }),
)(ChatScreen);
