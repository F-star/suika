import fitCurve from 'fit-curve';

import { type IPathItem, type ISegment } from '../type';
import { getBezierPoint, splitBezierSegs } from './geo_bezier';
import {
  distance,
  isZeroPoint,
  normalizeVec,
  pointAdd,
  pointSub,
} from './geo_point';

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

export const insertPathSeg = (
  pathItem: IPathItem,
  leftIndex: number,
  t: number,
) => {
  const segs = pathItem.segs;

  const isOutRangeAndNoClose =
    !pathItem.closed && (leftIndex < 0 || leftIndex >= segs.length - 1);

  if (isOutRangeAndNoClose) {
    segs.splice(leftIndex, 1);
    return pathItem;
  }

  let rightIndex = leftIndex + 1;
  if (pathItem.closed) {
    rightIndex %= segs.length;
  }

  const leftSeg = segs[leftIndex];
  const rightSeg = segs[rightIndex];

  const newSegs = splitBezierSegs(leftSeg, rightSeg, t);
  if (rightIndex === 0) {
    pathItem.segs.splice(leftIndex, 1, newSegs[0], newSegs[1]);
    pathItem.segs.splice(0, 1, newSegs[2]);
  } else {
    pathItem.segs.splice(leftIndex, 2, ...newSegs);
  }
  return pathItem;
};

export const deletePathSegAndHeal = (
  pathItem: IPathItem,
  targetIndex: number,
) => {
  const segs = pathItem.segs;
  if (segs.length <= 1) {
    pathItem.segs = [];
    return pathItem;
  }

  const isOutRangeAndNoClose =
    !pathItem.closed && (targetIndex <= 0 || targetIndex >= segs.length - 1);

  if (isOutRangeAndNoClose) {
    segs.splice(targetIndex, 1);
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

  const isNoCurve =
    isZeroPoint(leftSeg.out) &&
    isZeroPoint(rightSeg.in) &&
    isZeroPoint(midSeg.in) &&
    isZeroPoint(midSeg.out);
  if (isNoCurve) {
    segs.splice(targetIndex, 1);
    return pathItem;
  }

  const leftBezier = [
    leftSeg.point,
    pointAdd(leftSeg.out, leftSeg.point),
    pointAdd(midSeg.in, midSeg.point),
    midSeg.point,
  ];
  const rightBezier = [
    midSeg.point,
    pointAdd(midSeg.out, midSeg.point),
    pointAdd(rightSeg.in, rightSeg.point),
    rightSeg.point,
  ];

  const leftPoints = [
    getBezierPoint(leftBezier, 0.3),
    getBezierPoint(leftBezier, 0.6),
  ];

  const rightPoints = [
    getBezierPoint(rightBezier, 0.3),
    getBezierPoint(rightBezier, 0.6),
  ];

  const curve = fitCurve(
    [
      leftSeg.point,
      ...leftPoints,
      midSeg.point,
      ...rightPoints,
      rightSeg.point,
    ].map(({ x, y }) => [x, y]),
    9999,
  )[0];

  const handle1 = pointSub(
    {
      x: curve[1][0],
      y: curve[1][1],
    },
    leftSeg.point,
  );
  const handle2 = pointSub(
    {
      x: curve[2][0],
      y: curve[2][1],
    },
    rightSeg.point,
  );

  let leftOutDir = normalizeVec(leftSeg.out);
  if (Number.isNaN(leftOutDir.x) || Number.isNaN(leftOutDir.y)) {
    leftOutDir = normalizeVec(handle1);
  }

  let rightInDir = normalizeVec(rightSeg.in);
  if (Number.isNaN(rightInDir.x) || Number.isNaN(rightInDir.y)) {
    rightInDir = normalizeVec(handle2);
  }

  const newLeftOutLen = distance({ x: 0, y: 0 }, handle1);
  const newRightInLen = distance({ x: 0, y: 0 }, handle2);

  leftSeg.out = {
    x: leftOutDir.x * newLeftOutLen,
    y: leftOutDir.y * newLeftOutLen,
  };
  rightSeg.in = {
    x: rightInDir.x * newRightInLen,
    y: rightInDir.y * newRightInLen,
  };

  segs.splice(targetIndex, 1);
  return pathItem;
};
