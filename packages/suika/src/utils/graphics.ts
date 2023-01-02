import { IBox, INoEmptyArray, IPoint, IRect } from '../type.interface';

/**
 * 矩形是否相交
 */
export function isRectIntersect(rect1: IRect, rect2: IRect) {
  return (
    rect1.x <= rect2.x + rect2.width &&
    rect1.x + rect1.width >= rect2.x &&
    rect1.y <= rect2.y + rect2.height &&
    rect1.y + rect1.height >= rect2.y
  );
}

/**
 * 根据两个坐标点确定一个矩形
 */
export function getRectByTwoCoord(point1: IPoint, point2: IPoint): IRect {
  return {
    x: Math.min(point1.x, point2.x),
    y: Math.min(point1.y, point2.y),
    width: Math.abs(point1.x - point2.x),
    height: Math.abs(point1.y - point2.y),
  };
}

/**
 * 求多个矩形组成的包围盒
 */
export function getRectsBBox(...rects: IRect[]): IBox {
  if (rects.length === 0) {
    throw new Error('矩形数量不能为 0');
  }
  const first = rects[0];
  let x = first.x;
  let y = first.y;
  let x2 = x + first.width;
  let y2 = y + first.height;
  for (let i = 1, len = rects.length; i < len; i++) {
    const rect = rects[i];
    if (rect.x < x) {
      x = rect.x;
    }
    if (rect.y < y) {
      y = rect.y;
    }
    const _x2 = rect.x + rect.width;
    if (_x2 > x2) {
      x2 = _x2;
    }
    const _y2 = rect.y + rect.height;
    if (_y2 > y2) {
      y2 = _y2;
    }
  }
  return {
    x,
    y,
    width: x2 - x,
    height: y2 - y,
  };
}

/**
 * 点是否在矩形中
 */
export function isPointInRect(point: IPoint, rect: IRect) {
  return (
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x <= rect.x + rect.width &&
    point.y <= rect.y + rect.height
  );
}

/**
 * 矩形 1 是否包含矩形 2
 */
export function isRectContain(rect1: IRect, rect2: IRect) {
  return (
    rect1.x <= rect2.x &&
    rect2.y <= rect2.y &&
    rect1.x + rect1.width >= rect2.x + rect2.width &&
    rect1.y + rect1.height >= rect2.y + rect2.height
  );
}
