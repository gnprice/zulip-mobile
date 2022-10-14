/* @flow strict-local */
import * as React from 'react';
import type { Node } from 'react';
import { View } from 'react-native';

import { ThemeContext, createStyleSheet } from '../styles';

const componentStyles = createStyleSheet({
  divider: {
    borderBottomWidth: 1,
  },
});

export default function OptionDivider(props: {||}): Node {
  const themeContext = React.useContext(ThemeContext);
  return (
    <View style={[componentStyles.divider, { borderBottomColor: themeContext.dividerColor }]} />
  );
}
