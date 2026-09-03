import { type IPathCommand, type IPathItem, type IPoint } from '@suika/geo';
import { type PathKit, type SkPath } from '@suika/pathkit';
import svgpath from 'svgpath';

import { offsetPath, type OffsetPathOptions } from './utils/path';

/**
 * Provides PathKit-backed path operations to an editor.
 *
 * PathKit is supplied by the host so the editor does not own PathKit's
 * asynchronous WASM initialization.
 */
export class PathTool {
  constructor(private pathKit: PathKit) {}

  offsetPath(
    pathCmds: IPathCommand[][],
    distance: number,
    options?: OffsetPathOptions,
  ): IPathCommand[][] | null {
    const skPath = this.pathKit.FromCmds(
      pathCmds.flatMap((commands) =>
        commands.map((command) => this.pathCommandToSkCommand(command)),
      ),
    );
    if (!skPath) {
      return null;
    }

    try {
      const result = offsetPath(skPath, distance, this.pathKit, options);
      if (!result) {
        return null;
      }
      try {
        return this.skPathToPathCmds(result);
      } finally {
        result.delete();
      }
    } finally {
      skPath.delete();
    }
  }

  private pathCommandToSkCommand(command: IPathCommand): number[] {
    const points = command.points.flatMap((point) => [point.x, point.y]);
    switch (command.type) {
      case 'M':
        return [this.pathKit.MOVE_VERB, ...points];
      case 'L':
        return [this.pathKit.LINE_VERB, ...points];
      case 'C':
        return [this.pathKit.CUBIC_VERB, ...points];
      case 'Q':
        return [this.pathKit.QUAD_VERB, ...points];
      case 'Z':
        return [this.pathKit.CLOSE_VERB];
      default:
        throw new Error(`Unsupported path command: ${command.type}`);
    }
  }

  pathCmdsToPathData(pathCmds: IPathCommand[][]): IPathItem[] {
    const pathData: IPathItem[] = [];
    let currentPath: IPathItem | undefined;
    const addSegment = (point: IPoint, incoming: IPoint = { x: 0, y: 0 }) => {
      currentPath?.segs.push({ point, in: incoming, out: { x: 0, y: 0 } });
    };

    for (const commands of pathCmds) {
      for (const command of commands) {
        const points = command.points;
        if (command.type === 'M') {
          currentPath = { segs: [], closed: false };
          pathData.push(currentPath);
          addSegment(points[0]);
        } else if (command.type === 'L') {
          addSegment(points[0]);
        } else if (command.type === 'C') {
          const previous = currentPath?.segs.at(-1);
          if (!previous) continue;
          previous.out = {
            x: points[0].x - previous.point.x,
            y: points[0].y - previous.point.y,
          };
          addSegment(points[2], {
            x: points[1].x - points[2].x,
            y: points[1].y - points[2].y,
          });
        } else if (command.type === 'Q') {
          const previous = currentPath?.segs.at(-1);
          if (!previous) continue;
          const [control, end] = points;
          previous.out = {
            x: ((control.x - previous.point.x) * 2) / 3,
            y: ((control.y - previous.point.y) * 2) / 3,
          };
          addSegment(end, {
            x: ((control.x - end.x) * 2) / 3,
            y: ((control.y - end.y) * 2) / 3,
          });
        } else if (command.type === 'Z' && currentPath) {
          currentPath.closed = true;
        }
      }
    }

    return pathData.filter((item) => item.segs.length > 0);
  }

  private skPathToPathCmds(skPath: SkPath): IPathCommand[][] {
    const pathCmds: IPathCommand[][] = [];
    let commands: IPathCommand[] | undefined;

    svgpath(skPath.toSVGString())
      .abs()
      .unshort()
      .unarc()
      .iterate((segment) => {
        const type = segment[0].toUpperCase();
        const values = segment.slice(1) as number[];
        const points: IPoint[] = [];
        for (let i = 0; i < values.length; i += 2) {
          points.push({ x: values[i], y: values[i + 1] });
        }
        if (type === 'M') {
          commands = [];
          pathCmds.push(commands);
        }
        commands?.push({ type, points });
      });

    return pathCmds;
  }
}
