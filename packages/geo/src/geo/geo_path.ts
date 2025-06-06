import fitCurve from 'fit-curve';

import { type IPathItem, type ISegment } from '../type';
import { getBezierPoint } from './geo_bezier';

export const deletePathSegAndHeal = (
  pathItem: IPathItem,
  targetIndex: number,
) => {
  const segs = pathItem.segs;
  if (segs.length <= 1) {
    pathItem.segs = [];
    return pathItem;
  }

  let leftSegIndex = targetIndex - 1;
  let rightSegIndex = targetIndex + 1;
  if (pathItem.closed) {
    leftSegIndex %= segs.length;
    rightSegIndex %= segs.length;
  }

  const midSeg = segs[targetIndex];
  const leftSeg = segs[leftSegIndex];
  const rightSeg = segs[rightSegIndex];

  const leftBezier = [leftSeg.point, leftSeg.out, midSeg.in, midSeg.point];
  const rightBezier = [midSeg.point, midSeg.out, rightSeg.in, rightSeg.point];

  const p1 = getBezierPoint(leftBezier, 0.33);
  const p2 = getBezierPoint(leftBezier, 0.66);
  const p3 = getBezierPoint(rightBezier, 0.33);
  const p4 = getBezierPoint(rightBezier, 0.66);

  const curves = fitCurve(
    [leftSeg.point, p1, p2, midSeg.point, p3, p4, rightSeg.point].map(
      ({ x, y }) => [x, y],
    ),
    9999,
  );

  segs.splice(targetIndex, 1);
  // segs[]
};

export const simplePath = (segs: ISegment[], tol: number) => {
  const curves = fitCurve(
    segs.map(({ point }) => [point.x, point.y]),
    tol,
  );
  const newSegs: ISegment[] = [];
  for (let i = 0, len = curves.length; i <= len; i++) {
    const curve = curves[i];
    const prevCurve = curves[i - 1];
    const point = curve
      ? {
          x: curve[0][0],
          y: curve[0][1],
        }
      : {
          x: prevCurve[3][0],
          y: prevCurve[3][1],
        };
    const outPt = curve
      ? {
          x: curve[1][0] - point.x,
          y: curve[1][1] - point.y,
        }
      : { x: 0, y: 0 };
    const inPt = prevCurve
      ? {
          x: prevCurve[2][0] - point.x,
          y: prevCurve[2][1] - point.y,
        }
      : { x: 0, y: 0 };
    newSegs.push({
      point,
      in: inPt,
      out: outPt,
    });
  }
  return newSegs;
};
