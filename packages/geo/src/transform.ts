import { IPoint } from './type';

export const transformRotate = (
  x: number,
  y: number,
  radian: number,
  cx: number,
  cy: number,
): IPoint => {
  if (!radian) {
    return { x, y };
  }
  const cos = Math.cos(radian);
  const sin = Math.sin(radian);
  return {
    x: (x - cx) * cos - (y - cy) * sin + cx,
    y: (x - cx) * sin + (y - cy) * cos + cy,
  };
};
