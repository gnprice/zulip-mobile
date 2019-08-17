/* @flow strict-local */
import React from 'react';

import '../vendor/intl/intl';
import StoreProvider from './boot/StoreProvider';
import TranslationProvider from './boot/TranslationProvider';
import StylesProvider from './boot/StylesProvider';
import AppWithNavigation from './nav/AppWithNavigation';

import './i18n/locale';
import './sentry';

// $FlowFixMe
console.disableYellowBox = true; // eslint-disable-line

export default () => (
  <StoreProvider>
    <TranslationProvider>
      <StylesProvider>
          <AppWithNavigation />
      </StylesProvider>
    </TranslationProvider>
  </StoreProvider>
);
