/**
 *
 *
 * Sample usage:
 *   npx jscodeshift -t tools/codemod/….js src/
 *
 * Tips for future codemods:
 *  * A `recast` example user:
 *      https://github.com/abuiles/ember-watson/blob/master/lib/formulas/resource-router-mapping.js
 *  * To find more example users: https://libraries.io/npm/recast/dependents
 *  * See https://astexplorer.net/ and choose parser `flow` (in the bit of
 *    UI that initially says `acorn`.)  Super handy for finding the AST
 *    names for the constructs you want to find/modify.
 *  * For bringing in fancier analyses from an external tool like Flow, see
 *    the technique used here -- it ends up being super simple, thankfully:
 *      https://github.com/flowtype/flow-codemod/tree/master/transforms/strict-type-args
 *
 * @flow strict-local
 */

// $FlowFixMe[untyped-import]
import * as recast from 'recast';
// $FlowFixMe[untyped-import]
import * as flowParser from 'recast/parsers/flow';
// $FlowFixMe[untyped-import]
import { builders as b, namedTypes as n } from 'ast-types';
// $FlowFixMe[untyped-import]
import { NodePath } from 'ast-types/lib/node-path';
import assert from 'assert';

/* eslint-disable no-cond-assign */
/* eslint-disable consistent-return */
/* eslint-disable no-console */

export const parser = 'flow';

// For the Flow `%checks` syntax, see:
//   https://flow.org/en/docs/types/functions/#toc-predicate-functions
const checkStatement = (node: n.Node): boolean %checks => n.Statement.check(node);

export default function (fileInfo: any, { jscodeshift: j, report }: any) {
  // Adapted from zulip/zulip@02511bff1: use jscodeshift for its CLI, tweak a
  //   few bits of syntax for Flow, and apply to Array#forEach instead of _.each.

  const ast = recast.parse(fileInfo.source, { parser: flowParser });

  let changed = false;

  recast.visit(ast, {
    visitImport(path) {
      changed = false;
      path.node;
    },
  });

  if (changed) {
    console.log('Writing', fileInfo.path);
    return recast.print(ast).code;
  }
  return fileInfo.source;
}
