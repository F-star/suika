import { Matrix } from 'pixi.js';

import { type IMatrixArr, type IPoint } from '../type';

const DOUBLE_PI = Math.PI * 2;

export function rad2Deg(radian: number) {
  return (radian * 180) / Math.PI;
}

export function deg2Rad(degree: number) {
  return (degree * Math.PI) / 180;
}

/**
 * normalize radian, make it in [0, Math.PI * 2)
 */
export const normalizeRadian = (radian: number): number => {
  radian = radian % DOUBLE_PI;
  if (radian < 0) {
    radian += DOUBLE_PI;
  }
  return radian;
};

/**
 * normalize degree, make it in [0, 360)
 */
export const normalizeDegree = (degree: number): number => {
  degree = degree % 360;
  if (degree < 0) {
    degree += 360;
  }
  return degree;
};

/**
 * get sweep angle from vector a to vector b
 * direction is clockwise
 */
export const getSweepAngle = (a: IPoint, b: IPoint) => {
  // 点乘求夹角
  const dot = a.x * b.x + a.y * b.y;
  const d = Math.sqrt(a.x * a.x + a.y * a.y) * Math.sqrt(b.x * b.x + b.y * b.y);
  let cosTheta = dot / d;
  if (cosTheta > 1) {
    cosTheta = 1;
  } else if (cosTheta < -1) {
    cosTheta = -1;
  }

  let theta = Math.acos(cosTheta);
  if (a.x * b.y - a.y * b.x < 0) {
    theta = DOUBLE_PI - theta;
  }

  return theta;
};

/**
 * get angle of transform matrix
 */
export const getTransformAngle = (
  transform: IMatrixArr,
  angleBase = { x: 0, y: -1 },
) => {
  const tf = new Matrix(
    transform[0],
    transform[1],
    transform[2],
    transform[3],
    0,
    0,
  );
  const angleVec = tf.apply(angleBase);
  return getSweepAngle(angleBase, angleVec);
};

export const checkTransformFlip = (transform: IMatrixArr) => {
  return transform[0] * transform[3] - transform[1] * transform[2] < 0;
};
