// Array method without call this, so it will faster.

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

/**
 * map with revert
 */
export const arrMapRevert = <T, U>(
  array: T[],
  cb: (item: T, index: number) => U,
): U[] => {
  const ret: U[] = [];
  for (let i = array.length - 1; i >= 0; i--) {
    ret.push(cb(array[i], i));
  }
  return ret;
};

export const arrEvery = <T>(
  array: T[],
  cb: (item: T, index: number) => unknown,
): boolean => {
  for (let i = 0, len = array.length; i < len; i++) {
    if (!cb(array[i], i)) {
      return false;
    }
  }
  return true;
};
