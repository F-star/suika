import { Bezier } from 'bezier-js';

import { type IPathItem, type IPoint, type ISegment } from '../type';
import { pointAdd } from './geo_point';

/**
 * Path geometry algorithm
 */
export class GeoPath {
  constructor(private pathData: IPathItem[]) {}

  // hitTest(point: IPoint, padding: number) {
  //   // ...
  // }

  static getHandleIn(seg: ISegment) {
    return pointAdd(seg.point, seg.in);
  }

  static getHandleOut(seg: ISegment) {
    return pointAdd(seg.point, seg.out);
  }

  getBbox() {
    const pathData = this.pathData;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const pathItem of pathData) {
      const segs = pathItem.segs;
      for (let i = 1; i <= segs.length; i++) {
        if (i === segs.length && !pathItem.closed) {
          continue;
        }
        const seg = segs[i % segs.length];
        const prevSeg = segs[i - 1];
        const bbox = new Bezier(
          prevSeg.point,
          GeoPath.getHandleOut(prevSeg),
          GeoPath.getHandleIn(seg),
          seg.point,
        ).bbox();
        minX = Math.min(minX, bbox.x.min);
        minY = Math.min(minY, bbox.y.min);
        maxX = Math.max(maxX, bbox.x.max);
        maxY = Math.max(maxY, bbox.y.max);
      }
    }
    if (minX === Infinity) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
