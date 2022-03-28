/* @flow strict-local */
import React, { useCallback } from 'react';
import type { Node } from 'react';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import * as NavigationService from '../nav/NavigationService';
import { useSelector, useDispatch } from '../react-redux';
import { updateExistingStream, navigateBack } from '../actions';
import { getStreamForId } from '../selectors';
import Screen from '../common/Screen';
import EditStreamCard from './EditStreamCard';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'edit-stream'>,
  route: RouteProp<'edit-stream', {| streamId: number |}>,
|}>;

export default function EditStreamScreen(props: Props): Node {
  const dispatch = useDispatch();
  const stream = useSelector(state => getStreamForId(state, props.route.params.streamId));

  const handleComplete = useCallback(
    (
      name: string,
      description: string,
      policySettings: {|
        invite_only: boolean,
        is_web_public: boolean,
        history_public_to_subscribers: boolean,
      |},
    ) => {
      dispatch(
        updateExistingStream(stream.stream_id, stream, {
          name,
          description,
          invite_only: policySettings.invite_only,
          is_web_public: policySettings.is_web_public,
          history_public_to_subscribers: policySettings.history_public_to_subscribers,
        }),
      );
      NavigationService.dispatch(navigateBack());
    },
    [stream, dispatch],
  );

  return (
    <Screen title="Edit stream" padding>
      <EditStreamCard
        isNewStream={false}
        initialValues={{
          name: stream.name,
          description: stream.description,
          invite_only: stream.invite_only,
          history_public_to_subscribers: stream.history_public_to_subscribers,
          is_web_public: stream.is_web_public,
        }}
        onComplete={handleComplete}
      />
    </Screen>
  );
}
