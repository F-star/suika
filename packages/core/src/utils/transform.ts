import { type IMatrixArr } from '@suika/geo';

interface IVector {
  x: number;
  y: number;
}

export function transform(
  { x, y }: IVector,
  [a, b, c, d, e, f]: IMatrixArr,
): IVector {
  return {
    x: x * a + y * c + e,
    y: x * b + y * d + f,
  };
}

/**
 * 【目前没有使用】
 * 计算旋转前的 x、y
 * transformRotate 的反推
 */
export function getOriginXY(
  rotatedX: number,
  rotatedY: number,
  radian: number,
  width: number,
  height: number,
): [rotatedX: number, rotatedY: number] {
  if (!radian) {
    return [rotatedX, rotatedY];
  }
  const cos = Math.cos(radian);
  const sin = Math.sin(radian);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return [
    rotatedX - halfWidth - halfHeight * sin + halfWidth * cos,
    rotatedY - halfHeight + halfHeight * cos + halfWidth * sin,
  ];
}
