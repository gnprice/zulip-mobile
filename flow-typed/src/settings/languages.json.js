/* @flow strict */
// Has to be named exactly as the import will be, not the actual path.
// See comment by a helpful Flow user at facebook/flow#6772.
declare module './languages.json' {
  declare export default $ReadOnlyArray<{|
    locale: string,
    name: string,
    flag: string,
  |}>;
}
