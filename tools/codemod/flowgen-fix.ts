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
 */

import * as recast from 'recast';
import * as flowParser from 'recast/parsers/flow';
import { builders as b, namedTypes as n } from 'ast-types';
import { NodePath } from 'ast-types/lib/node-path';
import assert from 'assert';

/* eslint-disable no-cond-assign */
/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable one-var */
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable flowtype/no-types-missing-file-annotation */

const rewrites = {
  'react-native': {
    TextProps: 'react-native/Libraries/Text/TextProps',
    TextStyle: 'react-native/Libraries/StyleSheet/StyleSheet',
    ViewProps: 'react-native/Libraries/Components/View/ViewPropTypes',
    ViewStyle: 'react-native/Libraries/StyleSheet/StyleSheet',
  },
};

const importRedirectVisitor: recast.types.Visitor = {
  visitImportDeclaration(path) {
    const { source, specifiers, importKind, comments } = path.node;
    if (source.type !== 'StringLiteral') {
      return false;
    }

    const moves = new Map();
    const map = rewrites[source.value];
    if (!map) {
      return false;
    }

    for (const specifier of specifiers) {
      if (!n.ImportSpecifier.check(specifier)) {
        continue;
      }
      const { imported } = specifier;
      const rewritten = map[imported.name];
      if (rewritten) {
        moves.set(specifier, rewritten);
      }
    }

    if (!moves.size) {
      return false;
    }

    for (const [specifier, sourceName] of moves.entries()) {
      const added = b.importDeclaration([specifier], b.stringLiteral(sourceName), importKind);
      path.insertAfter(added);
    }

    const remaining = specifiers.filter(s => !moves.has(s));
    if (remaining.length) {
      const shorter = b.importDeclaration(remaining, source, importKind);
      shorter.comments = comments;
      path.replace(shorter);
    } else {
      path.prune();
    }

    return false;
  },
};

/** Fixes for Flow `import-type-as-value` errors. */
/* Ideally we'd get these from running Flow and seeing the errors.
   That could start with something like:
   $ npx flow --strip-root --json \
     | jq '.errors[]
           | select(.error_codes[0] == "import-type-as-value")
           | .message[0]
           | { path, descr }  # for a JSON object
           # or: | "\(.path):\(.line):\n    \(.descr)\n"  # for a human-convenient format
          ' -r
 */
const nonvalues = new Map([
  ['react-native/Libraries/Components/View/ViewPropTypes', new Set(['ViewProps'])],
  ['react-native/Libraries/StyleSheet/StyleSheet', new Set(['TextStyle', 'ViewStyle'])],
  ['react-native/Libraries/Text/TextProps', new Set(['TextProps'])],
  [
    '@react-navigation/native',
    new Set(['ParamListBase', 'Route', 'StackRouterOptions', 'StackNavigationState']),
  ],
]);

const importTypeAsTypeVisitor: recast.types.Visitor = {
  visitImportSpecifier(path) {
    const parent = path.parentPath.node;
    let source, imported;
    if (
      n.ImportDeclaration.check(parent)
      && parent.importKind === 'value'
      && ((source = parent.source), true)
      && n.StringLiteral.check(source)
      // @ts-expect-error importKind missing in ast-types, but does exist
      && path.node.importKind !== 'type'
      && ((imported = path.node.imported), true)
      && nonvalues.get(source.value)?.has(imported.name)
    ) {
      const { local, comments } = path.node;
      const r = b.importSpecifier(imported, local);
      // @ts-expect-error importKind missing in ast-types, but does get used
      r.importKind = 'type';
      r.comments = comments;
      path.replace(r);
    }
    return false;
  },
};

const reactTranslateVisitor: recast.types.Visitor = {
  visitFlowType(path) {
    if (n.GenericTypeAnnotation.check(path.node) && path.node.typeParameters) {
      // TODO these matchers are ugly -- relying on names rather than bindings.

      const { id, typeParameters } = path.node;

      // React.ForwardRefExoticComponent -> React.ComponentType
      // React.MemoExoticComponent -> React.ComponentType
      // React.NamedExoticComponent -> React.ComponentType
      // Lose some nuances, but not sure if those nuances are even meaningful.
      if (
        n.QualifiedTypeIdentifier.check(id)
        && n.Identifier.check(id.qualification)
        && id.qualification.name === 'React'
        && n.Identifier.check(id.id)
        && (id.id.name === 'ForwardRefExoticComponent'
          || id.id.name === 'MemoExoticComponent'
          || id.id.name === 'NamedExoticComponent')
      ) {
        const r = b.genericTypeAnnotation(
          b.qualifiedTypeIdentifier(b.identifier('React'), b.identifier('ComponentType')),
          typeParameters,
        );
        r.comments = path.node.comments;
        path.replace(r);
      }

      // React.ComponentProps -> React.ElementConfig
      // which is just the Flow name for (basically?) the same thing.
      if (
        n.QualifiedTypeIdentifier.check(id)
        && n.Identifier.check(id.qualification)
        && id.qualification.name === 'React'
        && n.Identifier.check(id.id)
        && id.id.name === 'ComponentProps'
      ) {
        path.replace(
          b.genericTypeAnnotation.from({
            comments: path.node.comments ?? null,
            id: b.qualifiedTypeIdentifier(id.qualification, b.identifier('ElementConfig')),
            typeParameters,
          }),
        );
      }

      // React.RefAttributes -> expand its definition.
      if (
        n.QualifiedTypeIdentifier.check(id)
        && n.Identifier.check(id.qualification)
        && id.qualification.name === 'React'
        && n.Identifier.check(id.id)
        && id.id.name === 'RefAttributes'
      ) {
        path.replace(
          b.objectTypeAnnotation.from({
            comments: path.node.comments ?? null,
            properties: [
              b.objectTypeProperty.from({
                variance: 'plus',
                key: b.identifier('ref'),
                optional: true,
                value: b.typeofTypeAnnotation(typeParameters.params[0]),
              }),
            ],
          }),
        );
      }
    }
    this.traverse(path);
  },
};

const ReactNativeTranslateVisitor: () => recast.types.Visitor = () => {
  const genericStylePropIdentifier = b.identifier('$ReactNative$GenericStyleProp');
  let needGenericStyleProp = false;

  const withAnimatedValueIdentifier = b.identifier('$ReactNative$Animated$WithAnimatedValue');
  let needwithAnimatedValue = false;

  return {
    visitImportSpecifier(path) {
      const parent = path.parentPath.node;
      let source, imported;
      if (
        n.ImportDeclaration.check(parent)
        && ((source = parent.source), true)
        && n.StringLiteral.check(source)
        && source.value === 'react-native'
        && ((imported = path.node.imported), true)
        && imported.name === 'StyleProp'
      ) {
        path.prune();
      }
      return false;
    },

    visitQualifiedTypeIdentifier(path) {
      // Rewrite Animated.AnimatedInterpolation -> Animated.Interpolation.
      // TODO: Implicitly assuming `import { Animated } from 'react-native'`.
      // This seems like just an error in the TS definitions.
      if (
        n.Identifier.check(path.node.qualification)
        && path.node.qualification.name === 'Animated'
        && path.node.id.name === 'AnimatedInterpolation'
      ) {
        path.replace(
          b.qualifiedTypeIdentifier.from({
            comments: path.node.comments ?? null,
            qualification: path.node.qualification,
            id: b.identifier('Interpolation'),
          }),
        );
      }

      // Rewrite Animated.WithAnimatedValue.
      // This is a clever type in the TS definition.
      if (
        n.Identifier.check(path.node.qualification)
        && path.node.qualification.name === 'Animated'
        && path.node.id.name === 'WithAnimatedValue'
      ) {
        needwithAnimatedValue = true;
        path.replace(
          b.identifier.from({
            ...withAnimatedValueIdentifier,
            comments: path.node.comments ?? null,
          }),
        );
      }

      this.traverse(path);
    },

    visitGenericTypeAnnotation(path) {
      // TODO these matchers are ugly -- relying on names rather than bindings.

      const { id, typeParameters } = path.node;

      // StyleProp is in TS definitions; upstream has GenericStyleProp but
      // doesn't export it.
      if (
        // TODO super ugly -- what if you happen to have same name?
        n.Identifier.check(id)
        && id.name === 'StyleProp'
      ) {
        needGenericStyleProp = true;
        path.replace(
          b.genericTypeAnnotation.from({
            comments: path.node.comments ?? null,
            id: genericStylePropIdentifier,
            typeParameters,
          }),
        );
      }

      this.traverse(path);
    },

    visitProgram(path) {
      this.traverse(path);

      if (needGenericStyleProp) {
        // We inserted a reference to genericStylePropIdentifier.
        // Add a definition for it.
        /* Compare `react-native/Libraries/StyleSheet/StyleSheetTypes.js`:
             type GenericStyleProp<+T> =
               | null
               | void
               | T
               | false
               | ''
               | $ReadOnlyArray<GenericStyleProp<T>>;
        */
        path.node.body.push(
          b.declareTypeAlias(
            genericStylePropIdentifier,
            b.typeParameterDeclaration([b.typeParameter('T', 'plus')]),
            b.unionTypeAnnotation([
              b.nullTypeAnnotation(),
              b.voidTypeAnnotation(),
              b.typeParameter('T'),
              b.booleanLiteralTypeAnnotation(false, 'false'),
              b.stringLiteralTypeAnnotation('', "''"),
              b.genericTypeAnnotation(
                b.identifier('$ReadOnlyArray'),
                b.typeParameterInstantiation([
                  b.genericTypeAnnotation(
                    genericStylePropIdentifier,
                    b.typeParameterInstantiation([b.typeParameter('T')]),
                  ),
                ]),
              ),
            ]),
          ),
        );
      }

      if (needwithAnimatedValue) {
        /* Compare TS definition:
    interface WithAnimatedArray<P> extends Array<WithAnimatedValue<P>> {}
    type WithAnimatedObject<T> = {
        [K in keyof T]: WithAnimatedValue<T[K]>;
    };

    export type WithAnimatedValue<T> = T extends Builtin | Nullable
        ? T
        : T extends Primitive
        ? T | Value | AnimatedInterpolation // add `Value` and `AnimatedInterpolation` but also preserve original T
        : T extends Array<infer P>
        ? WithAnimatedArray<P>
        : T extends {}
        ? WithAnimatedObject<T>
        : T; // in case it's something we don't yet know about (for .e.g bigint)
        */
        path.node.body.push(
          b.declareTypeAlias.from({
            id: withAnimatedValueIdentifier,
            typeParameters: b.typeParameterDeclaration([b.typeParameter('T')]),
            right: b.typeParameter('T'),
            comments: [b.commentLine(' TODO(flowgen-fix): actually implement this')],
          }),
        );
      }
    },
  };
};

export const parser = 'flow';

export default function (fileInfo: any, { jscodeshift: j, report }: any) {
  // Adapted loosely from zulip/zulip@02511bff1.
  const ast = recast.parse(fileInfo.source, { parser: flowParser });
  recast.visit(ast, importRedirectVisitor);
  recast.visit(ast, importTypeAsTypeVisitor);
  recast.visit(ast, reactTranslateVisitor);
  recast.visit(ast, ReactNativeTranslateVisitor());
  return recast.print(ast).code;
}
