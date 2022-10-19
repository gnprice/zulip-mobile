/* TODO: use tsflower
   @flow strict-local */
import type { ComponentType, ElementConfig } from 'react';
import { connectActionSheet as connectActionSheetInner } from '@expo/react-native-action-sheet';
import type { ActionSheetOptions } from '@expo/react-native-action-sheet';

import type { BoundedDiff } from './generics';

export type ShowActionSheetWithOptions = (ActionSheetOptions, (i?: number) => void) => void;

/**
 * Exactly like the `connectActionSheet` in
 *   `react-native-action-sheet` upstream, but more typed.
 */
export function connectActionSheet<P: { ... }, C: ComponentType<P>>(
  WrappedComponent: C,
): ComponentType<
  BoundedDiff<
    $Exact<ElementConfig<C>>,
    {| +showActionSheetWithOptions: ShowActionSheetWithOptions |},
  >,
> {
  return connectActionSheetInner(WrappedComponent);
}
