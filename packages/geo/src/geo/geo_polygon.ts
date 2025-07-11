import { type IPathCommand, type IPoint, type ISize } from '../type';
import { getAngleBetweenVec, getSweepAngle } from './geo_angle';
import { arcToBezier } from './geo_arc';
import { closestPtOnLine, getLineIntersection } from './geo_line';
import { Matrix } from './geo_matrix_class';
import { distance, isPointEqual, lerpNum, pointMid } from './geo_point';

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

export const roundPolygon = (polygon: IPoint[], radius: number) => {
  const path: IPathCommand[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[(i - 1 + polygon.length) % polygon.length];
    const p2 = polygon[i];
    const p3 = polygon[(i + 1) % polygon.length];

    const r = getCorrectedRadius(
      pointMid(p1, p2),
      p2,
      pointMid(p2, p3),
      radius,
    );

    const arc = getLineJointRoundArc([p1, p2], [p2, p3], r)!;

    if (i === 0) {
      path.push({
        type: 'M',
        points: [arc.start],
      });
    } else {
      const lastCmdPoints = path[path.length - 1].points;
      const lastAnchorPoint = lastCmdPoints[lastCmdPoints.length - 1];
      if (!isPointEqual(arc.start, lastAnchorPoint)) {
        path.push({
          type: 'L',
          points: [arc.start],
        });
      }
    }

    const pathCmds = arcToBezier({
      center: arc.center,
      r,
      startAngle: arc.startAngle,
      endAngle: arc.endAngle,
      angleDir: arc.angleDir,
    });

    path.push({
      type: 'C',
      points: [pathCmds[1], pathCmds[2], pathCmds[3]],
    });
  }
  path.push({
    type: 'Z',
    points: [],
  });
  return path;
};

const getCorrectedRadius = (
  p1: IPoint,
  p2: IPoint,
  p3: IPoint,
  radius: number,
) => {
  const v1 = {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
  };
  const v2 = {
    x: p2.x - p3.x,
    y: p2.y - p3.y,
  };
  const angle = getAngleBetweenVec(v1, v2) / 2;

  const r1 = Math.tan(angle) * distance(p1, p2);
  const r2 = Math.tan(angle) * distance(p2, p3);
  return Math.min(radius, r1, r2);
};

export const getLineJointRoundArc = (
  line1: IPoint[],
  line2: IPoint[],
  radius: number,
) => {
  const p1 = line1[0];
  const p2 = line1[1];
  const p3 = line2[0];
  const p4 = line2[1];

  const v1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
  };

  const v2 = {
    x: p4.x - p3.x,
    y: p4.y - p3.y,
  };

  const cp = v1.x * v2.y - v2.x * v1.y;
  if (cp === 0) {
    return null;
  }
  let normalVec1: IPoint;
  let normalVec2: IPoint;
  if (cp < 0) {
    normalVec1 = {
      x: v1.y,
      y: -v1.x,
    };
    normalVec2 = {
      x: -v2.y,
      y: v2.x,
    };
  } else {
    normalVec1 = {
      x: -v1.y,
      y: v1.x,
    };
    normalVec2 = {
      x: v2.y,
      y: -v2.x,
    };
  }

  const t1 = radius / distance(p1, p2);
  const d = {
    x: normalVec1.x * t1,
    y: normalVec1.y * t1,
  };
  const offsetLine1 = [
    {
      x: p1.x + d.x,
      y: p1.y + d.y,
    },
    {
      x: p2.x + d.x,
      y: p2.y + d.y,
    },
  ];

  const t2 = radius / distance(p3, p4);
  const d2 = {
    x: normalVec2.x * t2,
    y: normalVec2.y * t2,
  };
  const offsetLine2 = [
    {
      x: p3.x + d2.x,
      y: p3.y + d2.y,
    },
    {
      x: p4.x + d2.x,
      y: p4.y + d2.y,
    },
  ];

  const center = getLineIntersection(
    offsetLine1[0],
    offsetLine1[1],
    offsetLine2[0],
    offsetLine2[1],
  )!;

  const { point: start } = closestPtOnLine(p1, p2, center, true);
  const { point: end } = closestPtOnLine(p3, p4, center, true);

  const angleBase = { x: 1, y: 0 };
  const startAngle = getSweepAngle(angleBase, {
    x: start.x - center.x,
    y: start.y - center.y,
  });
  const endAngle = getSweepAngle(angleBase, {
    x: end.x - center.x,
    y: end.y - center.y,
  });

  return {
    center,
    start,
    end,
    startAngle,
    endAngle,
    angleDir: cp < 0, // positive --> clockwise
  };
};
