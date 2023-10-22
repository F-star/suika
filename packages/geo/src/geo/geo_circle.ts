import { ICircle, IPoint } from '../type';

export function isPointInCircle(point: IPoint, circle: ICircle) {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  const dSquare = dx * dx + dy * dy;
  return dSquare <= circle.radius * circle.radius;
}
