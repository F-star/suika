import { type IBox, type IPoint, type ITransformRect } from '../type';
import { applyMatrix } from './geo_matrix';
import { rectToVertices } from './geo_rect';

export const isPointInBox = (box: IBox, point: IPoint, tol = 0.00000001) => {
  return (
    point.x >= box.minX - tol &&
    point.y >= box.minY - tol &&
    point.x <= box.maxX + tol &&
    point.y <= box.maxY + tol
  );
};

/**
 * get merged rect from rects
 */
export const mergeBoxes = (boxes: IBox[]): IBox => {
  if (boxes.length === 0) {
    throw new Error('the count of boxes can not be 0');
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const box of boxes) {
    minX = Math.min(minX, box.minX);
    minY = Math.min(minY, box.minY);
    maxX = Math.max(maxX, box.maxX);
    maxY = Math.max(maxY, box.maxY);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
};

export const isBoxIntersect = (box1: IBox, box2: IBox) => {
  return (
    box1.minX <= box2.maxX &&
    box1.maxX >= box2.minX &&
    box1.minY <= box2.maxY &&
    box1.maxY >= box2.minY
  );
};

/** whether box1 contains box2 */
export const isBoxContain = (box1: IBox, box2: IBox) => {
  return (
    box1.minX <= box2.minX &&
    box1.minY <= box2.minY &&
    box1.maxX >= box2.maxX &&
    box1.maxY >= box2.maxY
  );
};

export const getPointsBbox = (points: IPoint[]): IBox => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pt of points) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x);
    maxY = Math.max(maxY, pt.y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
};

/**
 * calculate AABB
 */
export const calcRectBbox = (
  transformRect: ITransformRect,
  paddingBeforeTransform?: number,
): Readonly<IBox> => {
  let x = 0;
  let y = 0;
  let width = transformRect.width;
  let height = transformRect.height;
  if (paddingBeforeTransform) {
    x -= paddingBeforeTransform;
    y -= paddingBeforeTransform;
    width += paddingBeforeTransform * 2;
    height += paddingBeforeTransform * 2;
  }
  const tf = transformRect.transform;
  const vertices = rectToVertices({
    x,
    y,
    width,
    height,
  }).map((item) => {
    return applyMatrix(tf, item);
  });

  return getPointsBbox(vertices);
};
