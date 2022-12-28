import { IPoint, IRect } from '../type.interface';

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