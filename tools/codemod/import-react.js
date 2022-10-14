// @//flow strict-local

import * as recast from 'recast';
import * as flowParser from 'recast/parsers/flow';
import { builders as b, namedTypes as n } from 'ast-types';
import { NodePath } from 'ast-types/lib/node-path';
import assert from 'assert';

/* eslint-disable no-cond-assign */
/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable no-useless-return */ // wait, we have this?

export const parser = 'flow';

// For the Flow `%checks` syntax, see:
//   https://flow.org/en/docs/types/functions/#toc-predicate-functions
const checkStatement = (node: n.Node): boolean %checks => n.Statement.check(node);

export default function (fileInfo: any, { jscodeshift: j, report }: any) {
  const ast = recast.parse(fileInfo.source, { parser: flowParser });

  let changed = false;
  const nameMap = new Map();

  recast.visit(ast, {
    visitImportDeclaration(path) {
      const node: n.ImportDeclaration = path.node;
      if (
        node.source.value === 'react'
        && node.specifiers[0]
        && node.specifiers[0].type === 'ImportDefaultSpecifier'
      ) {
        if (node.specifiers[0].local.name !== 'React') {
          console.warn(
            `${fileInfo.path}: odd import of React as '${node.specifiers[0].local.name}'`,
          );
          return false;
        }

        for (let i = 1; i < node.specifiers.length; ++i) {
          const spec = node.specifiers[i];
          nameMap.set(spec.local.name, spec.imported.name);
        }

        path.get('specifiers').replace([b.importNamespaceSpecifier(b.identifier('React'))]);
        changed = true;
      }
      return false;
    },
  });
  if (!changed) {
    return fileInfo.source;
  }

  recast.visit(ast, {
    visitIdentifier(path) {
      // TODO this is pretty crude -- really we want a symbol table.

      const node: n.Identifier = path.node;
      const mapped = nameMap.get(node.name);
      if (mapped !== undefined) {
        path.replace(b.memberExpression(b.identifier('React'), b.identifier(mapped)));
      } else if (node.name.startsWith('React$')) {
        path.replace(
          b.qualifiedTypeIdentifier(
            b.identifier('React'),
            b.identifier(node.name.substring('React$'.length)),
          ),
        );
      }
      return false;
    },
  });

  console.log('Writing', fileInfo.path);
  return recast.print(ast).code;
}
