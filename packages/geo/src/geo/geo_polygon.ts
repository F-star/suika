import { type IPoint, type ISize } from '../type';
import { Matrix } from './geo_matrix_class';
import { lerpNum } from './geo_point';

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
    pt.x = lerpNum(cx, pt.x, t);
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
  let isIn = false;
  for (let i = 0; i < polygon.length; i++) {
    let a = polygon[i];
    let b = polygon[(i + 1) % polygon.length];

    if (a.y > b.y) {
      [a, b] = [b, a];
    }

    if (a.y <= pt.y && b.y > pt.y) {
      const crossProduct =
        (pt.x - a.x) * (b.y - a.y) - (b.x - a.x) * (pt.y - a.y);
      if (crossProduct === 0) {
        return true;
      } else if (crossProduct > 0) {
        isIn = !isIn;
      }
    }
  }

  return isIn;
};
