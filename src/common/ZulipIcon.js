// @flow strict-local
import React, { type Node } from 'react';
import { Text } from 'react-native';

// eslint-disable-next-line
import codePointMap from '../../static/assets/fonts/zulip-icons.map.js';

type Props = $ReadOnly<{|
  ...$Exact<React$ElementConfig<typeof Text>>,
  name: $Keys<typeof codePointMap>,
  size?: number,
  color?: string,
|}>;

const fontFamily = 'zulip-icons';

export default function ZulipIcon(props: Props): Node {
  const { name, size, color, style: styleOuter, ...restProps } = props;

  const codePoint = codePointMap[name];
  const glyph = codePoint == null ? '?' : String.fromCodePoint(codePoint);

  const style = [
    { fontSize: size, color },
    styleOuter,
    { fontFamily, fontWeight: 'normal', fontStyle: 'normal' },
  ];
  return (
    <Text selectable={false} style={style} {...restProps}>
      {glyph}
    </Text>
  );
}
