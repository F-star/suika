import { transformRotate } from '../transform';
import { IPoint, IRect, IRectWithRotation } from '../type';

export const getRectByTwoPoint = (point1: IPoint, point2: IPoint): IRect => {
  return {
    x: Math.min(point1.x, point2.x),
    y: Math.min(point1.y, point2.y),
    width: Math.abs(point1.x - point2.x),
    height: Math.abs(point1.y - point2.y),
  };
};

export const isPointInRect = (point: IPoint, rect: IRect, padding = 0) => {
  return (
    point.x >= rect.x - padding &&
    point.y >= rect.y - padding &&
    point.x <= rect.x + rect.width + padding &&
    point.y <= rect.y + rect.height + padding
  );
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
export const getMergedRect = (...rects: IRect[]): IRect => {
  if (rects.length === 0) {
    throw new Error('the count of rect can not be 0');
  }

  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

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

export const rectToPoints = (rect: IRectWithRotation) => {
  const { x, y, width, height, rotation = 0 } = rect;
  const [cx, cy] = [x + width / 2, y + height / 2];
  let points = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];

  if (rotation) {
    points = points.map((point) =>
      transformRotate(point.x, point.y, rotation, cx, cy),
    );
  }

  return {
    nw: points[0],
    ne: points[1],
    se: points[2],
    sw: points[3],
  };
};

export const offsetRect = (rect: IRectWithRotation, padding: number) => {
  const { x, y, width, height } = rect;
  return {
    x: x - padding,
    y: y - padding,
    width: width + padding * 2,
    height: height + padding * 2,
    rotation: rect.rotation,
  };
};

/** get mid-point of each segment */
export const rectToMidPoints = (rect: IRectWithRotation) => {
  const { x, y, width, height, rotation = 0 } = rect;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const [cx, cy] = [x + halfWidth, y + halfHeight];
  let points = [
    { x: x + halfWidth, y },
    { x: x + width, y: y + halfHeight },
    { x: x + halfWidth, y: y + height },
    { x, y: y + halfHeight },
  ];

  if (rotation) {
    points = points.map((point) =>
      transformRotate(point.x, point.y, rotation, cx, cy),
    );
  }

  return {
    n: points[0],
    e: points[1],
    s: points[2],
    w: points[3],
  };
};
