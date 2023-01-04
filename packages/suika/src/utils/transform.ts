interface IVector {
  x: number;
  y: number;
}

/**
 * a c e
 * b d f
 * 0 0 1
 */
type IMatrix = [
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
];

export function transform(
  { x, y }: IVector,
  [a, b, c, d, e, f]: IMatrix
): IVector {
  return {
    x: x * a + y * c + e,
    y: x * b + y * d + f,
  };
}

/**
 * 旋转
 */
export function transformRotate(
  { x, y }: IVector,
  radian: number,
  cx: number,
  cy: number
) {
  return {
    x: (x - cx) * Math.cos(radian) - (y - cy) * Math.sin(radian) + cx,
    y: (x - cx) * Math.sin(radian) + (y - cy) * Math.cos(radian) + cy,
  };
}
