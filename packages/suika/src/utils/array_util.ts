// Array method with call this, so it will faster.

/**
 * forEach
 */
export const forEach = <T>(
  array: T[],
  cb: (item: T, index: number) => void,
) => {
  for (let i = 0, len = array.length; i < len; i++) {
    cb(array[i], i);
  }
};

export const arrMap = <T, U>(
  array: T[],
  cb: (item: T, index: number) => U,
): U[] => {
  const ret: U[] = [];
  for (let i = 0, len = array.length; i < len; i++) {
    ret.push(cb(array[i], i));
  }
  return ret;
};
