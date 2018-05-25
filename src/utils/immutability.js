/* @flow */

export const removeItemsFromArray = (
  input: number[],
  itemsToRemove: number[],
): number[] => {
  const output = input.filter((item: number) => !itemsToRemove.includes(item));
  return input.length === output.length ? input : output;
};

export const addItemsToArray = (input: any[], itemsToAdd: any[]): any[] => {
  const newItems = itemsToAdd.filter((item: any) => !input.includes(item));
  return newItems.length > 0 ? [...input, ...itemsToAdd] : input;
};

export const filterArray = (input: any[], predicate: () => any): any[] => {
  const filteredList = input.filter(predicate);
  return filteredList.length === input.length ? input : filteredList;
};

export const replaceItemInArray = (
  input: any[],
  predicate: (item: any) => boolean,
  replaceFunc: (item: any) => any,
): any[] => {
  let replacementHappened = false;

  const newArray = input.map((x: any) => {
    if (predicate(x)) {
      replacementHappened = true;
      return replaceFunc(x);
    }
    return x;
  });

  if (!replacementHappened) {
    newArray.push(replaceFunc());
  }

  return newArray;
};
