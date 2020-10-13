/* @flow strict-local */
import React from 'react';
import 'react-native-url-polyfill/auto';

import '../vendor/intl/intl';
import StoreProvider from './boot/StoreProvider';
import TranslationProvider from './boot/TranslationProvider';
import ThemeProvider from './boot/ThemeProvider';
import CompatibilityChecker from './boot/CompatibilityChecker';
import AppEventHandlers from './boot/AppEventHandlers';
import AppDataFetcher from './boot/AppDataFetcher';
import InitialNavigationDispatcher from './nav/InitialNavigationDispatcher';
import AppContainer from './nav/AppContainer';
import NavigationService from './nav/NavigationService';

import './i18n/locale';
import { initializeSentry } from './sentry';

initializeSentry();

// $FlowFixMe
console.disableYellowBox = true; // eslint-disable-line

export default (): React$Node => (
  <CompatibilityChecker>
    <StoreProvider>
      <AppEventHandlers>
        <AppDataFetcher>
          <TranslationProvider>
            <ThemeProvider>
              <InitialNavigationDispatcher>
                <AppContainer
                  // `static navigationOptions` and `static router` not
                  // being handled properly
                  // $FlowFixMe
                  ref={NavigationService.appContainerRef}
                />
              </InitialNavigationDispatcher>
            </ThemeProvider>
          </TranslationProvider>
        </AppDataFetcher>
      </AppEventHandlers>
    </StoreProvider>
  </CompatibilityChecker>
);
