import { IPoint, IRect } from '../type';

export class GeoRect {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    /** base center point */
    public rotation = 0,
  ) {}

  getCenter(): IPoint {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  static getRectByTwoPoint(point1: IPoint, point2: IPoint): IRect {
    return {
      x: Math.min(point1.x, point2.x),
      y: Math.min(point1.y, point2.y),
      width: Math.abs(point1.x - point2.x),
      height: Math.abs(point1.y - point2.y),
    };
  }

  static isPointInRect(point: IPoint, rect: IRect, padding = 0) {
    return (
      point.x >= rect.x - padding &&
      point.y >= rect.y - padding &&
      point.x <= rect.x + rect.width + padding &&
      point.y <= rect.y + rect.height + padding
    );
  }
}
