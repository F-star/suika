import fitCurve from 'fit-curve';

import { type ISegment } from '../type';

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
