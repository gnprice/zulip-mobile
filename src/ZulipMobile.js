/* @flow strict-local */
import React from 'react';
import 'react-native-url-polyfill/auto';

import StoreProvider from './boot/StoreProvider';
import HideIfNotHydrated from './boot/HideIfNotHydrated';
import TranslationProvider from './boot/TranslationProvider';
import ThemeProvider from './boot/ThemeProvider';
import CompatibilityChecker from './boot/CompatibilityChecker';
import AppEventHandlers from './boot/AppEventHandlers';
import AppDataFetcher from './boot/AppDataFetcher';
import BackNavigationHandler from './nav/BackNavigationHandler';
import { AppContainer, InitialNavigationDispatcher } from './nav/ZulipAppContainer';
import * as NavigationService from './nav/NavigationService';
import { initializeSentry } from './sentry';
import LoadingScreen from './start/LoadingScreen';

initializeSentry();

// $FlowFixMe
console.disableYellowBox = true; // eslint-disable-line

export default (): React$Node => (
  <CompatibilityChecker>
    <StoreProvider>
      <HideIfNotHydrated PlaceholderComponent={LoadingScreen}>
        <AppEventHandlers>
          <AppDataFetcher>
            <TranslationProvider>
              <ThemeProvider>
                <InitialNavigationDispatcher>
                  <BackNavigationHandler>
                    <AppContainer ref={NavigationService.appContainerRef} />
                  </BackNavigationHandler>
                </InitialNavigationDispatcher>
              </ThemeProvider>
            </TranslationProvider>
          </AppDataFetcher>
        </AppEventHandlers>
      </HideIfNotHydrated>
    </StoreProvider>
  </CompatibilityChecker>
);
