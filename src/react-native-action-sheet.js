/* @flow strict-local */
import type { ComponentType, ElementConfig } from 'react';
import type { TextStyle } from 'react-native/Libraries/StyleSheet/StyleSheet';
// $FlowFixMe[untyped-import]
import { connectActionSheet as connectActionSheetInner } from '@expo/react-native-action-sheet';

import type { BoundedDiff } from './generics';

// This is a subtype of the actual ActionSheetOptions upstream.  We'll get the
// real thing in the future via TsFlower.
export type ActionSheetOptions = {|
  +options: string[],
  +cancelButtonIndex: number,
  +title?: string,
  +titleTextStyle?: TextStyle,
|};

export type ShowActionSheetWithOptions = (ActionSheetOptions, (number) => void) => void;

/**
 * Exactly like the `connectActionSheet` in
 *   `react-native-action-sheet` upstream, but more typed.
 */
export function connectActionSheet<P, C: ComponentType<P>>(
  WrappedComponent: C,
): ComponentType<
  BoundedDiff<
    $Exact<ElementConfig<C>>,
    {| +showActionSheetWithOptions: ShowActionSheetWithOptions |},
  >,
> {
  return connectActionSheetInner(WrappedComponent);
}
