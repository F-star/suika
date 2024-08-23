import { type IBox, type IPoint } from '../type';
import { getPointsBbox, isPointInBox } from './geo_box';
import { distance } from './geo_point';

type IBezierPoints = [IPoint, IPoint, IPoint, IPoint];

/**
 * cubic bezier
 */
export class GeoBezier {
  private points: IBezierPoints;
  private dpoints: IPoint[] = []; // control points of derivative
  private _bbox: IBox | null = null;
  private lut: { t: number; pt: IPoint }[] = []; // lookup table

  constructor(points: IBezierPoints) {
    this.points = points;

    this.dpoints[0] = {
      x: 3 * (points[1].x - points[0].x),
      y: 3 * (points[1].y - points[0].y),
    };
    this.dpoints[1] = {
      x: 3 * (points[2].x - points[1].x),
      y: 3 * (points[2].y - points[1].y),
    };
    this.dpoints[2] = {
      x: 3 * (points[3].x - points[2].x),
      y: 3 * (points[3].y - points[2].y),
    };
  }

  compute(t: number) {
    const t2 = t * t;
    const ct = 1 - t;
    const ct2 = ct * ct;
    const a = ct2 * ct;
    const b = 3 * t * ct2;
    const c = 3 * t2 * ct;
    const d = t2 * t;

    const [p1, cp1, cp2, p2] = this.points;

    return {
      x: a * p1.x + b * cp1.x + c * cp2.x + d * p2.x,
      y: a * p1.y + b * cp1.y + c * cp2.y + d * p2.y,
    };
  }

  extrema() {
    const dpoints = this.dpoints;
    const extrema = [
      ...getRoot(dpoints[0].x, dpoints[1].x, dpoints[2].x),
      ...getRoot(dpoints[0].y, dpoints[1].y, dpoints[2].y),
    ].filter((t) => t >= 0 && t <= 1);
    return Array.from(new Set(extrema));
  }

  getBbox() {
    if (!this._bbox) {
      const extremaPoints = this.extrema().map((t) => this.compute(t));
      this._bbox = getPointsBbox([
        ...extremaPoints,
        this.points[0],
        this.points[3],
      ]);
    }
    return this._bbox;
  }

  hitTest(point: IPoint, tol: number): boolean {
    if (!isPointInBox(this.getBbox(), point, tol)) {
      return false;
    }

    // based on the modification of "project algorithm"
    const lookupTable = this.getLookupTable();

    let minDist = Number.MAX_SAFE_INTEGER;
    let minIndex = -1;

    for (let i = 0; i < lookupTable.length; i++) {
      const item = lookupTable[i];
      const dist = distance(point, item.pt); // TODO: optimize, no sqrt
      if (dist <= tol) {
        return true;
      }
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }

    const minT = lookupTable[minIndex].t;

    const t1 = minIndex > 0 ? lookupTable[minIndex - 1].t : minT;
    const t2 =
      minIndex < lookupTable.length - 1 ? lookupTable[minIndex + 1].t : minT;

    const step = 0.001;
    for (let t = t1; t <= t2; t += step) {
      const pt = this.compute(t);
      const dist = distance(point, pt); // TODO: optimize, no sqrt
      if (dist <= tol) {
        return true;
      }
    }

    return false;
  }

  getLookupTable() {
    if (this.lut.length === 0) {
      const count = 100;
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const pt = this.compute(t);
        this.lut[i] = { t, pt };
      }
    }
    return this.lut;
  }

  project(targetPt: IPoint) {
    const lookupTable = this.getLookupTable();

    let minDist = Number.MAX_SAFE_INTEGER;
    let minIndex = -1;

    for (let i = 0; i < lookupTable.length; i++) {
      const item = lookupTable[i];
      const dist = distance(targetPt, item.pt); // TODO: optimize, no sqrt
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
        if (dist === 0) {
          break;
        }
      }
    }

    if (minDist === 0) {
      const projectPt = this.compute(lookupTable[minIndex].t);
      return {
        point: projectPt,
        t: lookupTable[minIndex].t,
        dist: distance(targetPt, projectPt),
      };
    }

    let minT = lookupTable[minIndex].t;

    const t1 = minIndex > 0 ? lookupTable[minIndex - 1].t : minT;
    const t2 =
      minIndex < lookupTable.length - 1 ? lookupTable[minIndex + 1].t : minT;

    const step = 0.001;
    for (let t = t1; t <= t2; t += step) {
      const pt = this.compute(t);
      const dist = distance(targetPt, pt); // TODO: optimize, no sqrt
      if (dist < minDist) {
        minDist = dist;
        minT = t;
        if (dist === 0) {
          break;
        }
      }
    }

    if (minT < 0) {
      minT = 0;
    }
    if (minT > 1) {
      minT = 1;
    }

    const projectPt = this.compute(minT);
    return {
      point: projectPt,
      t: minT,
      dist: distance(targetPt, projectPt),
    };
  }
}

const getRoot = (a: number, b: number, c: number) => {
  // denominator
  const d = a - 2 * b + c;

  if (d !== 0) {
    // quadratic equation
    const deltaSquare = b * b - a * c;
    if (deltaSquare < 0) {
      // no real roots
      return [];
    }
    const delta = Math.sqrt(deltaSquare);
    const m = a - b;
    if (delta === 0) {
      // one real root
      return [(m - delta) / d];
    } else {
      // two distinct roots
      return [(m - delta) / d, (m + delta) / d];
    }
  } else if (a !== b) {
    // linear equation
    return [a / (a - b) / 2];
  } else {
    // no equation
    return [];
  }
};
