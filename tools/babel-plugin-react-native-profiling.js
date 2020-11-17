/**
 * Rewrite certain imports within RN, to enable profiling.
 *
 * This looks like an awfully hacky way to do this, but it's a
 * translation of the equally-hacky way officially prescribed
 * for react-dom by React upstream:
 *   https://fb.me/react-profiling
 *   aka https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977
 *
 * The effect is that a release build of the app ends up using a
 * "profiling" version of some key React and RN internals, instead of
 * the "prod" version.  This is necessary for React.Profiler to work.
 *
 * Tested with RN v0.62.2.  Expected to work up through the latest RN,
 * as of RN v0.63.3.
 */

// Why is this in the form of a CommonJS module, you ask?  After all,
// we normally use good modern ES modules, with `import` and `export`
// declarations.
//
// Basically because, unlike our main codebase, this file gets run
// directly (as part of our build process), rather than transpiled
// first to some other JS code.
//
// In principle, that could be compatible with it being an ES module --
// Node has support for running ES modules directly.  But standard
// advice seems to be not to try to do that in practice, because other
// tools and frameworks aren't ready to handle ES modules.
//
// Specifically in this case, if we try that -- by naming this file with
// an extension `.mjs` rather than `.js`, to tell Node to treat it as an
// ES module -- then we have to do the same with babel.config.js... and
// then the latter produces a Babel error saying that's "only supported
// when running Babel asynchronously."  At this point the trail runs
// into a thicket where I timed out on pursuing it; I'm not sure exactly
// what code is responsible for choosing to run Babel synchronously
// vs. asynchronously -- perhaps Metro? -- but it seems well past what'd
// be worth trying to force into working.
//
// We could surely transpile this from ESM, as we do for our main
// codebase.  But it doesn't seem super appealing to add a build phase
// for our build phase, so we haven't.

"use strict";

exports.__esModule = true;
exports.default = pluginMain;

const rewrites = [
  // This one is in the upstream gist.
  [/^scheduler\/tracing$/, 'scheduler/tracing-profiling'],

  // This one is the equivalent of the `react-dom` -> `react-dom/profiling`
  // line in the upstream gist.  The imports we're seeking to rewrite
  // live in ReactNative.js and ReactFabric.js, in
  // node_modules/react-native/Libraries/Renderer/shims/,
  // and look like:
  //   ReactFabric = require('../implementations/ReactFabric-prod');
  // We need to replace '-prod' with '-profiling'.
  [/((?:^|\/)React(?:NativeRenderer|Fabric))-prod$/, '$1-profiling'],
];

function rewriteImportSource(path, state) {
  if (!path.node || path.node.type !== 'StringLiteral') {
    return;
  }
  const origSource = path.node.value;

  var source = origSource;
  for (const [pattern, replacement] of rewrites) {
    source = source.replace(pattern, replacement);
  }

  if (source !== origSource) {
    console.log('rewrite', state.file.opts.filename, origSource, source);
    path.node.value = source;
  }
}

function pluginMain() {
  return {
    visitor: {
      CallExpression(path, state) {
        if (path.node.callee.type === 'Identifier'
            && path.node.callee.name === 'require') {
          rewriteImportSource(path.get('arguments.0'), state);
        }
      },

      ExportDeclaration(path, state) {
        rewriteImportSource(path.get('source'), state);
      },

      ImportDeclaration(path, state) {
        rewriteImportSource(path.get('source'), state);
      },
    }
  }
}
