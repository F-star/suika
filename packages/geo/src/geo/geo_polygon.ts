import { Matrix } from 'pixi.js';

import { type IPoint, type ISize } from '../type';
import { lerp } from './geo_point';

export const getRegularPolygon = (size: ISize, count: number): IPoint[] => {
  const cx = size.width / 2;
  const cy = size.height / 2;

  const points: IPoint[] = [{ x: cx, y: 0 }];
  const rad = (Math.PI * 2) / count;
  const rotateTf = new Matrix()
    .translate(-cx, -cy)
    .rotate(rad)
    .translate(cx, cy);
  let prevPoint = points[0];
  for (let i = 1; i < count; i++) {
    const { x, y } = rotateTf.apply(prevPoint);
    const pt = { x, y };
    points.push(pt);
    prevPoint = pt;
  }

  // 两侧向中垂线塌陷
  const t = size.width / size.height;
  for (let i = 1; i < count; i++) {
    const pt = points[i];
    pt.x = lerp(cx, pt.x, t);
  }

  return points;
};

export const isPointInConvexPolygon = (polygon: IPoint[], point: IPoint) => {
  let dir: number | undefined = undefined;
  for (let i = 0; i < polygon.length; i++) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];
    const a = {
      x: end.x - start.x,
      y: end.y - start.y,
    };
    const b = {
      x: point.x - start.x,
      y: point.y - start.y,
    };
    const currDir = Math.sign(a.x * b.y - a.y * b.x);
    if (currDir === 0) {
      continue;
    }
    if (dir === undefined) {
      dir = currDir;
    } else if (dir !== currDir) {
      return false;
    }
  }
  return true;
};

export const isPointInPolygon = (polygon: IPoint[], pt: IPoint): boolean => {
  let count = 0;
  for (let i = 0; i < polygon.length; i++) {
    let a = polygon[i];
    let b = polygon[(i + 1) % polygon.length];

    if (a.y > b.y) {
      [a, b] = [b, a];
    }

    if (a.y <= pt.y && b.y > pt.y) {
      const crossProduct = cp(a, b, pt);
      if (crossProduct === 0) {
        return true;
      } else if (crossProduct > 0) {
        count++;
      }
    }
  }

  return count % 2 === 1;
};

/**
 * cross product of "p1->p2" and "p1->p3"
 */
const cp = (p1: IPoint, p2: IPoint, p3: IPoint): number => {
  const x1 = p2.x - p1.x;
  const y1 = p2.y - p1.y;
  const x2 = p3.x - p1.x;
  const y2 = p3.y - p1.y;
  return x1 * y2 - x2 * y1;
};
