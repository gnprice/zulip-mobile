/* @flow */
import type { InputSelectionType } from '../types';

export default (
  text: string,
  autocompleteText: string,
  selection: InputSelectionType,
) => {
  const { start, end } = selection;
  let residue = '';
  if (start === end && start !== text.length) {
    // new letter is typed
    residue = text.substring(start, text.length);
    text = text.substring(0, start);
  }
  const lastIndex: number = Math.max(
    text.lastIndexOf(':'),
    text.lastIndexOf('#'),
    text.lastIndexOf('@'),
  );
  const prefix = text[lastIndex] === ':' ? ':' : `${text[lastIndex]}**`;
  const suffix = text[lastIndex] === ':' ? ':' : '**';
  return `${text.substring(
    0,
    lastIndex,
  )}${prefix}${autocompleteText}${suffix} ${residue}`;
};
