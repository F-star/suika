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

export const isPointInRect = (
  point: IPoint,
  rect: IRectWithRotation,
  padding = 0,
) => {
  if (rect.rotation) {
    const [cx, cy] = [rect.x + rect.width / 2, rect.y + rect.height / 2];
    point = transformRotate(point.x, point.y, -rect.rotation, cx, cy);
  }

  return (
    point.x >= rect.x - padding &&
    point.y >= rect.y - padding &&
    point.x <= rect.x + rect.width + padding &&
    point.y <= rect.y + rect.height + padding
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

export const offsetRect = (
  rect: IRectWithRotation,
  padding: number | number[],
) => {
  if (typeof padding === 'number') {
    padding = [padding, padding, padding, padding];
  }
  const { x, y, width, height } = rect;

  return {
    x: x - padding[3],
    y: y - padding[0],
    width: width + padding[1] + padding[3],
    height: height + padding[0] + padding[2],
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

/**
 * Calculate the coordinates of the upper left corner of a shape, considering rotation
 */
export function getRectRotatedXY(rect: IRectWithRotation) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  return transformRotate(rect.x, rect.y, rect.rotation || 0, cx, cy);
}
