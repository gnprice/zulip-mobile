// For this, attempted a more automated approach (that seems to be closer to
// what `flowgen` is designed for): place *.js.flow files right next to each
// module's definition.
//
//   for f in node_modules/ast-types/{main,types,gen/*,lib/*}.d.ts; do
//     npx flowgen --add-flow-header "$f" -o "${f%.d.ts}".js.flow
//   done
//
// Pros:
//  * Importing one module from another works!
//  * Could do this automatically, particularly on upgrades.
//  * Only mildly unclean in-place modification within node_modules:
//    the upstream version has no *.js.flow files, so can always
//    return to pristine with `rm node_modules/ast-types/**/*.js.flow`.
//
// Things this approach doesn't handle:
//
//  * Types within TS namespaces. :-/  In particular `gen/namedTypes`
//    exports a `namedTypes` that's a namespace with a bunch of types
//    inside.  There's no direct equivalent in Flow.
//
//    * Flowgen as of v1.11.0 makes some effort here: a reference to
//      e.g. `namedTypes.Identifier` becomes `namedTypes$Identifier`,
//      and corresponding definitions appear in `namedTypes.js.flow`.
//
//      * But those definitions aren't exported; they'd need to be.
//
//      * And `import { namedTypes } from "./namedTypes"` would need to get
//        rewritten to `import { namedTypes$Identifier, … } …`, listing all
//        the types within, or at least all that are referenced in the given
//        module.
