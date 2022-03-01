/* @flow strict-local */

import React, { useState, useCallback } from 'react';
import type { Node } from 'react';

import type { NavProps } from '../react-navigation';
import { useGlobalSelector, useDispatch } from '../react-redux';
import Screen from '../common/Screen';
import LanguagePicker from './LanguagePicker';
import { getGlobalSettings } from '../selectors';
import { setGlobalSettings } from '../actions';

type Props = $ReadOnly<{|
  ...NavProps<'language', void>,
|}>;

export default function LanguageScreen(props: Props): Node {
  const dispatch = useDispatch();
  const language = useGlobalSelector(state => getGlobalSettings(state).language);

  const [filter, setFilter] = useState<string>('');

  const handleLocaleChange = useCallback(
    (value: string) => {
      dispatch(setGlobalSettings({ language: value }));
    },
    [dispatch],
  );

  return (
    <Screen search searchBarOnChange={setFilter} scrollEnabled={false}>
      <LanguagePicker value={language} onValueChange={handleLocaleChange} filter={filter} />
    </Screen>
  );
}
