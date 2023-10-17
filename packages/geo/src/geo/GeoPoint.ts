import { IPoint } from '../type';

export class GeoPoint {
  constructor(public x: number, public y: number) {}

  static distance(p1: IPoint, p2: IPoint) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }
}
