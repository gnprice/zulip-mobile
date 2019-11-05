/* @flow strict-local */
import { Platform } from 'react-native';
import type { ThemeName } from '../../types';
import cssPygments from './cssPygments';
import cssEmojis from './cssEmojis';
import cssNight from './cssNight';

/** CSS fragment to support scrolling of KaTeX formulae. */
/*
  By default, KaTeX renders (non-inline) math into a div of fixed precomputed
  width. This will be cut off by the edge of the screen when the formula is too
  long -- and on a mobile device, that's very nearly always.

  The naïve solution of simply giving some part of the KaTeX fragment itself an
  `overflow-x: auto` style breaks terribly:
    * Margin collapsing no longer works, causing rendering artifacts. (This is
      particularly visible on integral signs.)
    * `overflow-y: hidden` isn't respected. If KaTeX has used negative-position
      struts in its rendering (which it does frequently), there will always be
      vertical scrollability. (This may be a Chrome bug.)

  The added border functions as a UI hint to indicate that scrolling is
  possible and necessary. (This may not otherwise be apparent, if the equation
  is cut off between two symbols.)
*/
const katexScrollCss = `<style id="katex-mobile-scroll">
.zulip-katex-outer { display: block; overflow-x: auto; }
.zulip-katex-inner {
  display: inline-block;
  border: 1px solid hsla(187, 35%, 51%, .5);
  border-radius: 0.25em;
}
.zulip-katex-inner .katex-display { margin: 0.5em 0.25em; }
</style>`;

export default (theme: ThemeName) => `
<link rel='stylesheet' type='text/css' href='./base.css'>
<link rel='stylesheet' type='text/css' href='./katex/katex.css'>
<script defer src="./katex/katex.js"></script>
<style>
${theme === 'night' ? cssNight : ''}
${cssPygments(theme === 'night')}
${cssEmojis}
</style>
<style id="style-hide-js-error-plain">
#js-error-plain, #js-error-plain-dummy {
  display: none;
}
</style>
${katexScrollCss}
${Platform === 'android' ? katexFraclineFixCss : '<!-- Safari -->'}
<style id="generated-styles"></style>
`;
