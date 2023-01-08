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

/**
 * 找出离 value 最近的 segment 的倍数值
 */
export const getClosestVal = (value: number, segment: number) => {
  const n = Math.floor(value / segment);
  const left = segment * n;
  const right = segment * (n + 1);
  return value - left <= right - value ? left : right;
};

/**
 * 保留小数
 */
export const ceil = (n: number, digit = 1) => {
  return Number(n.toFixed(digit));
};

export const viewportCoordsToSceneUtil = (
  x: number,
  y: number,
  zoom: number,
  scrollX: number,
  scrollY: number
) => {
  return {
    x: scrollX + x / zoom,
    y: scrollY + y / zoom,
  };
};

export const sceneCoordsToViewportUtil = (
  x: number,
  y: number,
  zoom: number,
  scrollX: number,
  scrollY: number
) => {
  return {
    x: (x - scrollX) * zoom,
    y: (y - scrollY) * zoom,
  };
};
