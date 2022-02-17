// This tiny module is to avoid an import cycle between scroll.js and
// pressHandlers.js.
//
// @flow strict-local

let timeout = undefined;

export const clearLongPressTimeout = () => {
  clearTimeout(timeout);
};

export const setLongPressTimeout = (f: () => mixed, t: number) => {
  timeout = setTimeout(f, t);
};
