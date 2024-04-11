import { Matrix } from 'pixi.js';

import { transformRotate } from '../transform';
import {
  type IMatrixArr,
  type IPoint,
  type IRect,
  type IRectWithRotation,
  type ISize,
  type ITransformRect,
} from '../type';
import { normalizeRadian } from './geo_angle';
import { distance } from './geo_point';

export const getRectByTwoPoint = (point1: IPoint, point2: IPoint): IRect => {
  return {
    x: Math.min(point1.x, point2.x),
    y: Math.min(point1.y, point2.y),
    width: Math.abs(point1.x - point2.x),
    height: Math.abs(point1.y - point2.y),
  };
};

export const getRectByPoints = (points: IPoint[]): IRect => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;
  return { x, y, width, height };
};

export const isPointInRect = (
  point: IPoint,
  rect: {
    width: number;
    height: number;
    transform?: IMatrixArr;
  },
  padding = 0,
) => {
  if (rect.transform) {
    const matrix = new Matrix(...rect.transform);
    point = matrix.applyInverse(point);
  }

  return (
    point.x >= -padding &&
    point.y >= -padding &&
    point.x <= rect.width + padding &&
    point.y <= rect.height + padding
  );
};

export const isPointInRoundRect = (
  point: IPoint,
  rect: IRectWithRotation,
  cornerRadii: number[],
  padding = 0,
) => {
  const x = rect.x - padding;
  const y = rect.y - padding;
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  if (rect.rotation) {
    const [cx, cy] = [x + width / 2, y + height / 2];
    point = transformRotate(point.x, point.y, -rect.rotation, cx, cy);
  }

  if (
    point.x >= x &&
    point.y >= y &&
    point.x <= x + width &&
    point.y <= y + height
  ) {
    if (point.x <= x + cornerRadii[0] && point.y <= y + cornerRadii[0]) {
      return (
        (point.x - x - cornerRadii[0]) ** 2 +
          (point.y - y - cornerRadii[0]) ** 2 <=
        cornerRadii[0] ** 2
      );
    } else if (
      point.x >= x + width - cornerRadii[1] &&
      point.y <= y + cornerRadii[1]
    ) {
      return (
        (point.x - x - width + cornerRadii[1]) ** 2 +
          (point.y - y - cornerRadii[1]) ** 2 <=
        cornerRadii[1] ** 2
      );
    } else if (
      point.x >= x + width - cornerRadii[2] &&
      point.y >= y + height - cornerRadii[2]
    ) {
      return (
        (point.x - x - width + cornerRadii[2]) ** 2 +
          (point.y - y - height + cornerRadii[2]) ** 2 <=
        cornerRadii[2] ** 2
      );
    } else if (
      point.x <= x + cornerRadii[3] &&
      point.y >= y + height - cornerRadii[3]
    ) {
      return (
        (point.x - x - cornerRadii[3]) ** 2 +
          (point.y - y - height + cornerRadii[3]) ** 2 <=
        cornerRadii[3] ** 2
      );
    } else {
      return true;
    }
  } else {
    return false;
  }
};

/**
 * normalize rect,
 * width or height may be negative
 */
export const normalizeRect = ({ x, y, width, height }: IRect): IRect => {
  const x2 = x + width;
  const y2 = y + height;
  return getRectByTwoPoint({ x, y }, { x: x2, y: y2 });
};

/**
 * get merged rect from rects
 */
export const mergeRect = (...rects: IRect[]): IRect => {
  if (rects.length === 0) {
    throw new Error('the count of rect can not be 0');
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const isRectIntersect = (rect1: IRect, rect2: IRect) => {
  return (
    rect1.x <= rect2.x + rect2.width &&
    rect1.x + rect1.width >= rect2.x &&
    rect1.y <= rect2.y + rect2.height &&
    rect1.y + rect1.height >= rect2.y
  );
};

/** whether rect1 contains rect2 */
export const isRectContain = (rect1: IRect, rect2: IRect) => {
  return (
    rect1.x <= rect2.x &&
    rect1.y <= rect2.y &&
    rect1.x + rect1.width >= rect2.x + rect2.width &&
    rect1.y + rect1.height >= rect2.y + rect2.height
  );
};

export const offsetRect = (rect: IRect, padding: number | number[]) => {
  if (typeof padding === 'number') {
    padding = [padding, padding, padding, padding];
  }
  const { x, y, width, height } = rect;

  return {
    x: x - padding[3],
    y: y - padding[0],
    width: width + padding[1] + padding[3],
    height: height + padding[0] + padding[2],
  };
};

/** get mid-point of each segment */
export const rectToMidPoints = (rect: IRect) => {
  const { x, y, width, height } = rect;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return [
    { x: x + halfWidth, y },
    { x: x + width, y: y + halfHeight },
    { x: x + halfWidth, y: y + height },
    { x, y: y + halfHeight },
  ];
};

/**
 * Calculate the coordinates of the upper left corner of a shape, considering rotation
 */
export const getRectRotatedXY = (rect: IRectWithRotation) => {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  return transformRotate(rect.x, rect.y, rect.rotation || 0, cx, cy);
};

/**
 * line -> rect with rotation, and height is 0
 */
export const getRotatedRectByTwoPoint = (
  point1: IPoint,
  point2: IPoint,
): IRectWithRotation => {
  const { x, y } = point1;
  const width = point2.x - point1.x;
  const height = point2.y - point1.y;
  const rotation = normalizeRadian(Math.atan2(height, width));
  const cx = x + width / 2;
  const cy = y + height / 2;
  const p = transformRotate(x, y, -rotation, cx, cy);

  return {
    x: p.x,
    y: p.y,
    width: Math.sqrt(width * width + height * height),
    height: 0,
    rotation,
  };
};

/**
 * Convert a rectangle to an array of vertices
 */
export const rectToVertices = (rect: IRect, tf?: IMatrixArr): IPoint[] => {
  const { x, y, width, height } = rect;
  let pts = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
  if (tf) {
    const matrix = new Matrix(...tf);
    pts = pts.map((point) => {
      const pt = matrix.apply(point);
      return { x: pt.x, y: pt.y };
    });
  }
  return pts;
};

/**
 * get bbox after transform
 * then get the rect of the bbox
 */
export const getRectApplyMatrix = (rect: ITransformRect) => {
  const pts = rectToVertices(
    {
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
    },
    rect.transform,
  );

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pt of pts) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x);
    maxY = Math.max(maxY, pt.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const getTransformedSize = (rect: ITransformRect): ISize => {
  const tf = new Matrix(
    rect.transform[0],
    rect.transform[1],
    rect.transform[2],
    rect.transform[3],
    0,
    0,
  );
  const rightTop = tf.apply({ x: rect.width, y: 0 });
  const leftBottom = tf.apply({ x: 0, y: rect.height });
  const zero = { x: 0, y: 0 };
  return {
    width: distance(rightTop, zero),
    height: distance(leftBottom, zero),
  };
};

/**
 * 重新计算 width、height 和 transform
 * 确保 transform 后的 size 和 transform 前的 size 相同
 */
export const recomputeTransformRect = (
  rect: ITransformRect,
): ITransformRect => {
  const newSize = getTransformedSize(rect);
  const scaleX = newSize.width ? rect.width / newSize.width : 1;
  const scaleY = newSize.height ? rect.height / newSize.height : 1;
  const scaleMatrix = new Matrix().scale(scaleX, scaleY);

  const tf = new Matrix(...rect.transform).append(scaleMatrix);
  return {
    width: newSize.width,
    height: newSize.height,
    transform: [tf.a, tf.b, tf.c, tf.d, tf.tx, tf.ty],
  };
};
