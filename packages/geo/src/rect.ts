import { IRect } from './types';

export class GeoRect {
  x: number;
  y: number;
  width: number;
  height: number;
  constructor({ x, y, width, height }: IRect) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * if 2 rect intersected
   */
  static isIntersect(rect1: IRect, rect2: IRect) {
    return (
      rect1.x <= rect2.x + rect2.width &&
      rect1.x + rect1.width >= rect2.x &&
      rect1.y <= rect2.y + rect2.height &&
      rect1.y + rect1.height >= rect2.y
    );
  }
}
