import { type IBox, type IPoint } from '../type';
import { getPointsBbox, isPointInBox } from './geo_box';
import { distance } from './geo_point';

type IBezierPoints = [IPoint, IPoint, IPoint, IPoint];

/**
 * cubic bezier
 */
export class GeoBezier {
  private points: IBezierPoints;
  private dpoints: IPoint[][] = []; // control points of derivative
  private _bbox: IBox | null = null;
  private lut: { t: number; pt: IPoint }[] = []; // lookup table

  constructor(points: IBezierPoints) {
    this.points = points;
    this.dpoints = derive(points);
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
      ...getRoot(dpoints[0].map((p) => p.x)),
      ...getRoot(dpoints[1].map((p) => p.x)),
      ...getRoot(dpoints[0].map((p) => p.y)),
      ...getRoot(dpoints[1].map((p) => p.y)),
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

  toCommand() {
    const [p1, cp1, cp2, p2] = this.points;
    if (p1.x === cp1.x && cp1.x === cp2.x && cp2.x === p2.x) {
      return [
        { type: 'M', points: [p1] },
        { type: 'C', points: [cp1, cp2, p2] },
      ];
    } else {
      return [
        { type: 'M', points: [p1] },
        { type: 'C', points: [cp1, cp2, p2] },
      ];
    }
  }
}

const getRoot = (nums: number[]) => {
  const [a, b, c] = nums;
  if (nums.length === 3) {
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
    }
  } else if (nums.length === 2) {
    if (a !== b) {
      return [a / (a - b)];
    }
  }
  return [];
};

const derive = (points: IPoint[]) => {
  const dpoints = [];
  for (let p = points, len = p.length, c = len - 1; len > 1; len--, c--) {
    const list = [];
    for (let i = 0, dpt; i < c; i++) {
      dpt = {
        x: c * (p[i + 1].x - p[i].x),
        y: c * (p[i + 1].y - p[i].y),
      };
      list.push(dpt);
    }
    dpoints.push(list);
    p = list;
  }
  return dpoints;
};
