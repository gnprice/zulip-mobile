/* @flow strict-local */
import { connect } from '../react-redux';
import type { Connected, OwnProps } from '../react-redux';

import React, { PureComponent } from 'react';
import type { ComponentType, ElementConfig, Node as React$Node } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import type { Context, Dimensions, GlobalState, LocalizableText, Style, Dispatch } from '../types';
import KeyboardAvoider from './KeyboardAvoider';
import OfflineNotice from './OfflineNotice';
import ZulipStatusBar from './ZulipStatusBar';
import { getSession } from '../selectors';
import ModalNavBar from '../nav/ModalNavBar';
import ModalSearchNavBar from '../nav/ModalSearchNavBar';
import styles from '../styles';

const componentStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  childrenWrapper: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

type Props = {|
  centerContent: boolean,
  keyboardShouldPersistTaps: 'never' | 'always' | 'handled',
  padding: boolean,
  scrollEnabled: boolean,
  search: boolean,
  autoFocus: boolean,
  searchBarOnChange: (text: string) => void,

  canGoBack: boolean,
  +title: LocalizableText,

  +children: React$Node,
  style?: Style,

  dispatch: Dispatch,
  safeAreaInsets: Dimensions,
|};

/**
 * Wrapper component for each screen of the app, for consistent look-and-feel.
 *
 * Provides a nav bar, colors the status bar, can center the contents, etc.
 * The `children` are ultimately wrapped in a `ScrollView` from upstream.
 *
 * @prop [centerContent] - Should the contents be centered.
 * @prop children - Components to render inside the screen.
 * @prop [keyboardShouldPersistTaps] - Passed through to ScrollView.
 * @prop [padding] - Should padding be added to the contents of the screen.
 * @prop [scrollEnabled] - Passed through to ScrollView.
 * @prop [style] - Additional style for the ScrollView.
 *
 * @prop [search] - If 'true' show a search box in place of the title.
 * @prop [autoFocus] - If search bar enabled, should it be focused initially.
 * @prop [searchBarOnChange] - Event called on search query change.
 *
 * @prop [canGoBack] - If true (the default), show UI for "navigate back".
 * @prop [title] - Text shown as the title of the screen.
 *                 Required unless `search` is true.
 */
class Screen extends PureComponent<Props> {
  context: Context;

  static contextTypes = {
    styles: () => null,
  };

  static defaultProps = {
    centerContent: false,
    keyboardShouldPersistTaps: 'handled',
    padding: false,
    scrollEnabled: true,

    search: false,
    autoFocus: false,
    searchBarOnChange: (text: string) => {},

    canGoBack: true,
    title: '',
  };

  render() {
    const {
      autoFocus,
      canGoBack,
      centerContent,
      children,
      keyboardShouldPersistTaps,
      padding,
      safeAreaInsets,
      scrollEnabled,
      search,
      searchBarOnChange,
      style,
      title,
    } = this.props;
    const { styles: contextStyles } = this.context;

    return (
      <View style={[contextStyles.screen, { paddingBottom: safeAreaInsets.bottom }]}>
        <ZulipStatusBar />
        {search ? (
          <ModalSearchNavBar autoFocus={autoFocus} searchBarOnChange={searchBarOnChange} />
        ) : (
          <ModalNavBar canGoBack={canGoBack} title={title} />
        )}
        <OfflineNotice />
        <KeyboardAvoider
          behavior="padding"
          style={[componentStyles.wrapper, padding && styles.padding]}
          contentContainerStyle={[padding && styles.padding]}
        >
          <ScrollView
            contentContainerStyle={
              /* $FlowFixMe wants ViewStyleProp */
              [styles.flexed, centerContent && componentStyles.content, style]
            }
            style={componentStyles.childrenWrapper}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            scrollEnabled={scrollEnabled}
          >
            {children}
          </ScrollView>
        </KeyboardAvoider>
      </View>
    );
  }
}

// CAUTION: These only function when actually forced to be instantiated.
// E.g. a hoped-for
//   type With<S, P> = S;
// utters not a peep at
//   const x: With<null, IsEqual<string, number>> = null;
// Still, probably handy if used cleverly.
type IsSupertype<+S, +T: S> = S;
type IsSupertype2<+S, +T: S> = T; // a helper
type IsSubtype<+S, +T> = IsSupertype2<T, S>; // i.e. S, if true
type IsEqual<+S, +T: S> = IsSupertype2<T, S>; // i.e. S (== T), if true

/*
 * Has type T, but only if T <= T1 -- and T, T1 both instantiable.
 *
 * E.g. Chain<S, IsEqual<S, T>> is S, but additionally requires S == T.
 */
type Chain<T1, T: T1> = T;
type And1<T1, T: T1> = T;
type And2<T2, T1: T2, T: T1> = T;

type IsElementwiseSubtype<+S, +T> =
  $ObjMapi<S,
    <K, V>(K, V) => IsSubtype<V, $ElementType<T, K>>
  >;

// Oddly, Flow accepts this declaration with <-U, -L> but also with <+U, +L>.
type BoundedDiff<-U, -L> = $Diff<
  IsSupertype<U, $ReadOnly<{| ...U, ...L |}>>,
  $ObjMap<L, () => mixed>,
>;

//type OwnProps<-C, -SP> = $Diff<BoundedDiff<ElementConfig<C>, SP>, {| dispatch: Dispatch |}>;

function connect1<
  SP,
  P,
  C: ComponentType<P>,
  //</P>SP: IsElementwiseSubtype<$Exact<SP1>, ElementConfig<C>>,
  >(mapStateToProps: GlobalState => SP): C => ComponentType<OwnProps<C, SP>> {
  return connect(mapStateToProps);
}

const msp = (state: GlobalState) => ({
  safeAreaInsets: ((32: $FlowFixMe): Dimensions),
});

const cr = connect(msp);

//const c: ComponentType<OwnProps<typeof Screen, $Call<typeof msp, empty>>> = cr(Screen);
const c = cr(Screen);

export default c;

export const foo: Connected<typeof msp, typeof Screen> = connect(msp)(Screen);

// bad -- infers empty
// export const cr2: <C: ComponentType<*>>(C) => Connected<typeof msp, C> = connect(msp);

export const c3 = connect(msp)(Screen);