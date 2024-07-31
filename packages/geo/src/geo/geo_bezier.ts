import { type IPoint, type ISegment } from '../type';
import { lerp, pointAdd } from './geo_point';

export const getBezierPoint = (points: IPoint[], t: number) => {
  if (points.length === 4) {
    const [p1, cp1, cp2, p2] = points;
    const t2 = t * t;
    const ct = 1 - t;
    const ct2 = ct * ct;
    const a = ct2 * ct;
    const b = 3 * t * ct2;
    const c = 3 * t2 * ct;
    const d = t2 * t;

    return {
      x: a * p1.x + b * cp1.x + c * cp2.x + d * p2.x,
      y: a * p1.y + b * cp1.y + c * cp2.y + d * p2.y,
    };
  }

  while (points.length > 1) {
    const nextPts = [];
    for (let i = 0, size = points.length - 1; i < size; i++) {
      nextPts.push(lerp(points[i], points[i + 1], t));
    }
    points = nextPts;
  }
  return points[0];
};

export const breakSegs = (
  seg1: ISegment,
  seg2: ISegment,
  t: number,
): [ISegment, ISegment, ISegment] => {
  const p1 = seg1.point;
  const p2 = seg2.point;
  const cp1 = pointAdd(seg1.point, seg1.out);
  const cp2 = pointAdd(seg2.point, seg2.in);

  const a = lerp(p1, cp1, t);
  const b = lerp(cp1, cp2, t);
  const c = lerp(cp2, p2, t);

  const d = lerp(a, b, t);
  const e = lerp(b, c, t);

  const f = lerp(d, e, t);

  return [
    {
      point: seg1.point,
      in: seg1.in,
      out: a,
    },
    {
      point: f,
      in: d,
      out: e,
    },
    {
      point: seg2.point,
      in: e,
      out: seg2.out,
    },
  ];
};
