import { IRect } from '../type.interface';

export const noop = () => {
  // do nothing
};

/**
 * 生成唯一 ID
 */
export const genId = (() => {
  let id = 0;
  return () => {
    return id++;
  };
})();

/**
 * 浅比较
 */
type IObject = Record<string | symbol, any>;

export const shallowCompare = (a: IObject, b: IObject) => {
  for (const i in a) if (!(i in b)) return true;
  for (const i in b) if (a[i] !== b[i]) return true;
  return false;
};
