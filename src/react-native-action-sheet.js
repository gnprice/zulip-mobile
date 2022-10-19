/* TODO: use tsflower
   @flow strict-local */
import type { ComponentType, ElementConfig } from 'react';
import {
  connectActionSheet as connectActionSheetInner,
  type ActionSheetProps,
} from '@expo/react-native-action-sheet';

import type { BoundedDiff } from './generics';

export type ShowActionSheetWithOptions = ActionSheetProps['showActionSheetWithOptions'];

/**
 * Exactly like the `connectActionSheet` in
 *   `react-native-action-sheet` upstream, but more typed.
 */
export function connectActionSheet<
  P: { +showActionSheetWithOptions: ShowActionSheetWithOptions, ... },
  C: ComponentType<P>,
>(
  WrappedComponent: C,
): ComponentType<
  BoundedDiff<
    $Exact<ElementConfig<C>>,
    {| +showActionSheetWithOptions: ShowActionSheetWithOptions |},
  >,
> {
  // $FlowFixMe[prop-missing]: upstream types use intersection
  return connectActionSheetInner(WrappedComponent);
}
