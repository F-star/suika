import { type IPoint, type ISize } from '../type';
import { Matrix } from './geo_matrix_class';
import { lerp, lerpNum } from './geo_point';

export const getStar = (
  size: ISize,
  count: number,
  innerScale: number,
): IPoint[] => {
  const cx = size.width / 2;
  const cy = size.height / 2;

  const points: IPoint[] = new Array(count * 2);
  points[0] = { x: cx, y: 0 };
  const rad = (Math.PI * 2) / count;

  // out
  const rotateTf = new Matrix()
    .translate(-cx, -cy)
    .rotate(rad)
    .translate(cx, cy);

  let prevPoint = points[0];
  for (let i = 1; i < count; i++) {
    const { x, y } = rotateTf.apply(prevPoint);
    const pt = { x, y };
    points[i * 2] = pt;
    prevPoint = pt;
  }

  // inner
  const innerRotateTf = new Matrix()
    .translate(-cx, -cy)
    .rotate(rad / 2)
    .translate(cx, cy);
  prevPoint = lerp(
    { x: cx, y: cy },
    innerRotateTf.apply(points[0]),
    innerScale,
  );

  points[1] = prevPoint;
  for (let i = 1; i < count; i++) {
    const { x, y } = rotateTf.apply(prevPoint);
    const pt = { x, y };
    points[i * 2 + 1] = pt;
    prevPoint = pt;
  }

  const t = size.width / size.height;
  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    pt.x = lerpNum(cx, pt.x, t);
  }

  return points;
};
