/* @flow strict-local */
import type { IsSupertype } from '../types';

const magic: empty = (1: $FlowFixMe);

//
//
// Test IsSupertype.
//

// To get the expected errors, we'll need to force Flow to actually
// instantiate the type and look inside.  (This is why `IsSupertype`
// returns an interesting type in the first place, rather than some
// constant like `empty` or `mixed`.)  We'll do that with a cast.

// We'll need the type we cast from to also be a more interesting type than
// `empty`, as a value of type `empty` causes Flow to just declare victory:
(magic: IsSupertype<number, mixed>);

// Test the basics, relative to a primitive type.
(1: IsSupertype<number, empty>);
(1: IsSupertype<number, number>);
// $FlowExpectedError
(1: IsSupertype<number, mixed>);
// $FlowExpectedError
(1: IsSupertype<number, string>);

// Test the resulting type (as opposed to whether the type is instantiable
// at all, which is the main point.)
(magic: IsSupertype<number, number>);
// $FlowExpectedError
((1: mixed): IsSupertype<number, number>);
// $FlowExpectedError
('': IsSupertype<number, number>);

// OTOH if the supertype is `empty`, there's no way to get an error.
// That's OK because the only way to use the type is to hand it an
// impossible value anyway:
(magic: IsSupertype<empty, number>);

// Test on object types.
{
  // A value to cast.
  const a: {| a: number |} = { a: 1 };
  // Check that the casts don't themselves cause errors,
  // so the errors we find below really do come from IsSupertype.
  (a: { a: number, ... });
  (a: {| a: number |});
  (a: {| +a: number |});

  // Exact <: inexact, strictly.
  (a: IsSupertype<{ a: number, ... }, { a: number, ... }>);
  (a: IsSupertype<{| a: number |}, {| a: number |}>);
  (a: IsSupertype<{ a: number, ... }, {| a: number |}>);
  // $FlowExpectedError
  (a: IsSupertype<{| a: number |}, { a: number, ... }>);

  // Variance and invariance of properties.
  (a: IsSupertype<{| +a: number |}, {| +a: empty |}>);
  // $FlowExpectedError
  (a: IsSupertype<{| +a: number |}, {| +a: mixed |}>);
  // $FlowExpectedError
  (a: IsSupertype<{| a: number |}, {| a: empty |}>);
  // $FlowExpectedError
  (a: IsSupertype<{| a: number |}, {| a: mixed |}>);

  // Read-write <: read-only, strictly.
  (a: IsSupertype<{| +a: number |}, {| a: number |}>);
  // $FlowExpectedError
  (a: IsSupertype<{| a: number |}, {| +a: number |}>);

  // Another value to cast.
  const ab: {| a: number, b: number |} = { a: 1, b: 2 };
  (ab: { a: number, b: number, ... });
  (ab: {| a: number, b: number |});

  // Extra properties; exact and inexact doing their jobs.
  (a: IsSupertype<{ a: number, ... }, { a: number, b: number, ... }>);
  (a: IsSupertype<{ a: number, ... }, {| a: number, b: number |}>);
  // $FlowExpectedError
  (ab: IsSupertype<{ a: number, b: number, ... }, { a: number, ... }>);
  // $FlowExpectedError
  (ab: IsSupertype<{| a: number, b: number |}, { a: number, ... }>);
  // $FlowExpectedError
  (a: IsSupertype<{| a: number |}, { a: number, b: number, ... }>);
  // $FlowExpectedError
  (a: IsSupertype<{| a: number |}, {| a: number, b: number |}>);
}
