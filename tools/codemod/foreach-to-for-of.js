/**
 * Rewrite apparent Array#forEach calls to use for..of instead.
 *
 * Sample usage:
 *   npx jscodeshift -t tools/codemod/foreach-to-for-of.js src/
 *
 * Limitations:
 *  * This doesn't know anything about the types!  If the callee wasn't
 *    actually an Array, nor something else whose forEach method is
 *    equivalent to iterating with for..of, this can make a wrong
 *    transformation.
 *  * This will not rewrite `forEach` calls that are embedded inside an
 *    expression, are the argument of a `return`, or otherwise aren't the
 *    root expression of an expression statement.
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
 * @flow
 */

import * as recast from 'recast';
import * as flowParser from 'recast/parsers/flow';
import { builders as b, namedTypes as n } from 'ast-types';
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
  let inLoop = false;
  let replaceReturn = false;

  const visitLoop = (...args: string[]) =>
    /* eslint-disable-next-line func-names */
    function (path: NodePath<>) {
      // There's a good reason this is an old-fashioned anonymous function:
      // we want to say `this.visit` to mean the same thing as it does in
      // the method definitions below.
      for (const arg of args) {
        this.visit(path.get(arg));
      }
      const old = { inLoop };
      inLoop = true;
      this.visit(path.get('body'));
      inLoop = old.inLoop;
      return false;
    };

  recast.visit(ast, {
    visitDoWhileStatement: visitLoop('test'),

    visitExpressionStatement(path) {
      const { expression, comments } = path.node;
      let valueOnly;
      if (
        n.CallExpression.check(expression)
        && n.MemberExpression.check(expression.callee)
        && !expression.callee.computed
        && n.Identifier.check(expression.callee.property)
        && ['forEach'].includes(expression.callee.property.name)
        && [1, 2].includes(expression.arguments.length)
        && (n.FunctionExpression.check(expression.arguments[0])
          || n.ArrowFunctionExpression.check(expression.arguments[0]))
        && [1, 2].includes(expression.arguments[0].params.length)
        && n.Identifier.check(expression.arguments[0].params[0])
        && ((valueOnly = expression.arguments[0].params[1] === undefined)
          || n.Identifier.check(expression.arguments[0].params[1]))
        && (expression.arguments[1] === undefined || n.ThisExpression.check(expression.arguments[1]))
      ) {
        const old = { inLoop, replaceReturn };
        inLoop = false;
        replaceReturn = true;
        this.visit(
          path
            .get('expression')
            .get('arguments')
            .get(0)
            .get('body'),
        );
        inLoop = old.inLoop;
        replaceReturn = old.replaceReturn;

        const right = expression.callee.object;
        const [{ body, params }] = expression.arguments;
        const loop = b.forOfStatement(
          b.variableDeclaration('let', [
            b.variableDeclarator(valueOnly ? params[0] : b.arrayPattern([params[1], params[0]])),
          ]),
          valueOnly
            ? right
            : b.callExpression(b.memberExpression(right, b.identifier('entries')), []),
          checkStatement(body) ? body : b.expressionStatement(body),
        );
        loop.comments = comments;
        path.replace(loop);
        changed = true;
      }
      this.traverse(path);
    },

    visitForStatement: visitLoop('init', 'test', 'update'),

    visitForInStatement: visitLoop('left', 'right'),

    visitForOfStatement: visitLoop('left', 'right'),

    visitFunction(path) {
      this.visit(path.get('params'));
      const old = { replaceReturn };
      replaceReturn = false;
      this.visit(path.get('body'));
      replaceReturn = old.replaceReturn;
      return false;
    },

    visitReturnStatement(path) {
      if (replaceReturn) {
        assert(!inLoop); // could use labeled continue if this ever fires
        const { argument, comments } = path.node;
        if (argument === null) {
          const s = b.continueStatement();
          s.comments = comments;
          path.replace(s);
        } else {
          const s = b.expressionStatement(argument);
          s.comments = comments;
          path.replace(s, b.continueStatement());
        }
        return false;
      }
      this.traverse(path);
    },

    visitWhileStatement: visitLoop('test'),
  });

  if (changed) {
    console.log('Writing', fileInfo.path);
    return recast.print(ast).code;
  }
  return fileInfo.source;
}
