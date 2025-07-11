import { type IPoint } from '../type';
import { distance } from './geo_point';

/**
 * get point of line p1-p2 which is closest of p
 */
export const closestPtOnLine = (
  p1: IPoint,
  p2: IPoint,
  p: IPoint,
  canOutside = true,
) => {
  if (p1.x === p2.x && p1.y === p2.y) {
    return {
      t: 0,
      point: { x: p1.x, y: p1.y },
    };
  }
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dx * dx + dy * dy);
  if (!canOutside) {
    t = Math.max(0, Math.min(1, t));
  }
  const closestPt = {
    x: p1.x + t * dx,
    y: p1.y + t * dy,
  };
  return {
    t,
    point: closestPt,
  };
};

/**
 * get closest point of polar coords. 0, 45, 90, 135, 150
 */
export const getPolarTrackSnapPt = (center: IPoint, p: IPoint, count = 4) => {
  let closestPt: IPoint = { x: 0, y: 0 };
  let closestDist = Infinity;
  for (let i = 1; i <= count; i++) {
    const rad = (Math.PI / count) * i;
    const pt = {
      x: center.x + Math.cos(rad),
      y: center.y + Math.sin(rad),
    };
    const { point } = closestPtOnLine(center, pt, p);
    const dist = distance(point, p);
    if (dist === 0) {
      return point;
    }
    if (dist < closestDist) {
      closestDist = dist;
      closestPt = point;
    }
  }
  return closestPt;
};

/** get intersection of two lines */
export const getLineIntersection = (
  p1: IPoint,
  p2: IPoint,
  p3: IPoint,
  p4: IPoint,
): IPoint | null => {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  const { x: x3, y: y3 } = p3;
  const { x: x4, y: y4 } = p4;

  const a = y2 - y1;
  const b = x1 - x2;
  const c = x1 * y2 - x2 * y1;

  const d = y4 - y3;
  const e = x3 - x4;
  const f = x3 * y4 - x4 * y3;

  const denominator = a * e - b * d;

  if (Math.abs(denominator) < 0.000000001) {
    return null;
  }

  const px = (c * e - f * b) / denominator;
  const py = (a * f - c * d) / denominator;

  return { x: px, y: py };
};
