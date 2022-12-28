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
