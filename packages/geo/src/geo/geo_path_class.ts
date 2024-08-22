import { type IPathItem, type IPoint, type ISegment } from '../type';
import { GeoBezier } from './geo_bezier_class';
import { pointAdd } from './geo_point';

/**
 * Path geometry algorithm
 */
export class GeoPath {
  private bezierLists: GeoBezier[][];

  constructor(pathData: IPathItem[]) {
    const bezierItems: GeoBezier[][] = [];
    for (let i = 0; i < pathData.length; i++) {
      const pathItem = pathData[i];
      const segs = pathItem.segs;
      bezierItems[i] = [];
      for (let j = 1; j <= segs.length; j++) {
        if (j === segs.length && !pathItem.closed) {
          continue;
        }
        const seg = segs[j % segs.length];
        const prevSeg = segs[j - 1];
        bezierItems[i].push(
          new GeoBezier([
            prevSeg.point,
            GeoPath.getHandleOut(prevSeg),
            GeoPath.getHandleIn(seg),
            seg.point,
          ]),
        );
      }
    }
    this.bezierLists = bezierItems;
  }

  static getHandleIn(seg: ISegment) {
    return pointAdd(seg.point, seg.in);
  }

  static getHandleOut(seg: ISegment) {
    return pointAdd(seg.point, seg.out);
  }

  getBbox() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const bezierList of this.bezierLists) {
      for (const bezier of bezierList) {
        const bbox = bezier.getBbox();
        minX = Math.min(minX, bbox.minX);
        minY = Math.min(minY, bbox.minY);
        maxX = Math.max(maxX, bbox.maxX);
        maxY = Math.max(maxY, bbox.maxY);
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

  project(point: IPoint) {
    let minDist = Infinity;
    let minDistPoint: IPoint | null = null;

    for (const bezierList of this.bezierLists) {
      for (const bezier of bezierList) {
        const projectInfo = bezier.project(point);
        if (projectInfo.dist === 0) {
          return {
            dist: projectInfo.dist,
            point: projectInfo.point,
          };
        }
        if (projectInfo.dist < minDist) {
          minDist = projectInfo.dist;
          minDistPoint = projectInfo.point;
        }
      }
    }
    return {
      dist: minDist,
      point: minDistPoint,
    };
  }
}
