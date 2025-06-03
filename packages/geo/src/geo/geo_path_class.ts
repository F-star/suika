import {
  type IPathCommand,
  type IPathItem,
  type IPoint,
  type ISegment,
} from '../type';
import { GeoBezier } from './geo_bezier_class';
import { pointAdd } from './geo_point';

interface IBezierCurves {
  isClosed: boolean;
  curves: GeoBezier[];
}

/**
 * Path geometry algorithm
 */
export class GeoPath {
  private bezierLists: IBezierCurves[];

  constructor(pathData: IPathItem[]) {
    const bezierItems: IBezierCurves[] = [];
    for (let i = 0; i < pathData.length; i++) {
      const pathItem = pathData[i];
      const segs = pathItem.segs;
      bezierItems[i] = {
        isClosed: pathItem.closed,
        curves: [],
      };
      for (let j = 1; j <= segs.length; j++) {
        if (j === segs.length && !pathItem.closed) {
          continue;
        }
        const seg = segs[j % segs.length];
        const prevSeg = segs[j - 1];
        bezierItems[i].curves.push(
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

    for (const { curves } of this.bezierLists) {
      for (const bezier of curves) {
        const bbox = bezier.getBbox();
        minX = Math.min(minX, bbox.minX);
        minY = Math.min(minY, bbox.minY);
        maxX = Math.max(maxX, bbox.maxX);
        maxY = Math.max(maxY, bbox.maxY);
      }
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
    };
  }

  getBRect() {
    const bbox = this.getBbox();

    if (bbox.minX === Infinity) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
    return {
      x: bbox.minX,
      y: bbox.minY,
      width: bbox.maxX - bbox.minX,
      height: bbox.maxY - bbox.minY,
    };
  }

  hitTest(point: IPoint, tol: number) {
    for (const { curves } of this.bezierLists) {
      for (const bezier of curves) {
        if (bezier.hitTest(point, tol)) {
          return true;
        }
      }
    }
    return false;
  }

  project(point: IPoint, tol = Infinity) {
    const result = {
      dist: tol,
      point: { x: 0, y: 0 },
      index: [-1, -1],
      t: -1,
    };

    for (let i = 0; i < this.bezierLists.length; i++) {
      const { curves } = this.bezierLists[i];
      for (let j = 0; j < curves.length; j++) {
        const bezier = curves[j];
        const projectInfo = bezier.project(point);
        if (projectInfo.dist < result.dist) {
          result.dist = projectInfo.dist;
          result.point = projectInfo.point;
          result.index = [i, j];
          result.t = projectInfo.t;
        }
        if (projectInfo.dist === 0) {
          break;
        }
      }
    }
    if (result.index[0] === -1) {
      return null;
    }
    return result;
  }

  toCommands(): IPathCommand[] {
    const retCmds: IPathCommand[] = [];
    for (const { isClosed, curves } of this.bezierLists) {
      for (let i = 0; i < curves.length; i++) {
        const bezier = curves[i];
        const cmd = bezier.toCommand();
        if (i === 0) {
          retCmds.push(...cmd);
        } else {
          retCmds.push(...cmd.slice(1));
        }
      }
      if (isClosed) {
        retCmds.push({
          type: 'Z',
          points: [],
        });
      }
    }
    return retCmds;
  }
}

export const commandsToStr = (commands: IPathCommand[], precision: number) => {
  return commands
    .map(
      (cmd) =>
        cmd.type +
        cmd.points
          .map(
            (pt) =>
              remainDecimal(pt.x, precision) +
              ' ' +
              remainDecimal(pt.y, precision),
          )
          .join(' '),
    )
    .join(' ');
};

const remainDecimal = (num: number, precision = 2) => {
  return Number(num.toFixed(precision));
};
