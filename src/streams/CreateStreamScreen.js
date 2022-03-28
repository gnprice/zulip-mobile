/* @flow strict-local */
import React, { useCallback } from 'react';
import type { Node } from 'react';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import * as NavigationService from '../nav/NavigationService';
import { useSelector } from '../react-redux';
import { navigateBack } from '../actions';
import { getAuth, getOwnEmail } from '../selectors';
import Screen from '../common/Screen';
import EditStreamCard from './EditStreamCard';
import * as api from '../api';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'create-stream'>,
  route: RouteProp<'create-stream', void>,
|}>;

export default function CreateStreamScreen(props: Props): Node {
  const auth = useSelector(getAuth);
  const ownEmail = useSelector(getOwnEmail);

  const handleComplete = useCallback(
    (
      name: string,
      description: string,
      accessPolicy: {
        invite_only: boolean,
        is_web_public: boolean,
        history_public_to_subscribers: boolean,
      },
    ) => {
      api.createStream(auth, name, description, [ownEmail], accessPolicy.invite_only);
      NavigationService.dispatch(navigateBack());
    },
    [auth, ownEmail],
  );

  return (
    <Screen title="Create new stream" padding>
      <EditStreamCard
        isNewStream
        initialValues={{
          name: '',
          description: '',
          invite_only: false,
          is_web_public: false,
          history_public_to_subscribers: false,
        }}
        onComplete={handleComplete}
      />
    </Screen>
  );
}
