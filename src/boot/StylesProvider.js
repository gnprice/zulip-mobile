/* @flow strict-local */

import React, { PureComponent } from 'react';

import type { Node as React$Node } from 'react';
import type { ThemeName } from '../types';
import { stylesFromTheme, themeColors, ThemeContext } from '../styles/theme';

const Dummy = props => props.children;

type Props = {|
  theme: ThemeName,
  children: React$Node,
|};

export default class StyleProvider extends PureComponent<Props> {
  static childContextTypes = {
    styles: () => {},
  };

  static defaultProps = {
    theme: 'default',
  };

  getChildContext() {
    const { theme } = this.props;
    const styles = stylesFromTheme(theme);
    return { styles };
  }

  render() {
    const { children, theme } = this.props;

    return (
      <ThemeContext.Provider value={themeColors[theme]}>
        <Dummy key={theme}>{children}</Dummy>
      </ThemeContext.Provider>
    );
  }
}
