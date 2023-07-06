import { Editor } from './editor';
import { IBox2 } from '../type';
import { bboxToBboxWithMid, isRectIntersect2 } from '../utils/graphics';
import { getClosestValInSortedArr } from '../utils/common';
import { drawLine, drawXShape } from '../utils/canvas';

interface IVerticalLine {
  x: number;
  ys: number[];
}

interface IHorizontalLine {
  y: number;
  xs: number[];
}

/**
 * reference line
 */
export class RefLine {
  private hLineMap = new Map<number, number[]>(); // 参考图形产生的垂直参照线，y 相同（作为 key），x 值不同（作为 value）
  private vLineMap = new Map<number, number[]>(); // 参考图形产生的水平照线，x 相同（作为 key），y 值不同（作为 value）

  private sortedXs: number[] = []; // 对 hLineMap 的 key 排序
  private sortedYs: number[] = []; // 对 vLineMap 的 key 排序

  private toDrawVLines: IVerticalLine[] = []; // 等待绘制的垂直参照线
  private toDrawHLines: IHorizontalLine[] = []; // 等待绘制的水平参照线

  constructor(private editor: Editor) {}

  cacheXYToBbox() {
    this.clear();

    const hLineMap = this.hLineMap;
    const vLineMap = this.vLineMap;

    const selectIdSet = this.editor.selectedElements.getIdSet();
    const viewportBbox = this.editor.viewportManager.getBbox2();
    for (const graph of this.editor.sceneGraph.children) {
      if (selectIdSet.has(graph.id)) {
        continue;
      }

      const bbox = bboxToBboxWithMid(graph.getBBox2());
      if (!isRectIntersect2(viewportBbox, bbox)) {
        continue;
      }

      this.addBboxToMap(hLineMap, bbox.minX, [bbox.minY, bbox.maxY]);
      this.addBboxToMap(hLineMap, bbox.midX, [bbox.minY, bbox.maxY]);
      this.addBboxToMap(hLineMap, bbox.maxX, [bbox.minY, bbox.maxY]);

      this.addBboxToMap(vLineMap, bbox.minY, [bbox.minX, bbox.maxX]);
      this.addBboxToMap(vLineMap, bbox.midY, [bbox.minX, bbox.maxX]);
      this.addBboxToMap(vLineMap, bbox.maxY, [bbox.minX, bbox.maxX]);
    }

    this.sortedXs = Array.from(hLineMap.keys()).sort((a, b) => a - b);
    this.sortedYs = Array.from(vLineMap.keys()).sort((a, b) => a - b);
  }
  clear() {
    this.hLineMap.clear();
    this.vLineMap.clear();
    this.sortedXs = [];
    this.sortedYs = [];
    this.toDrawVLines = [];
    this.toDrawHLines = [];
  }
  private addBboxToMap(
    m: Map<number, number[]>,
    xOrY: number,
    xsOrYs: number[],
  ) {
    const line = m.get(xOrY);
    if (line) {
      line.push(...xsOrYs);
    } else {
      m.set(xOrY, [...xsOrYs]);
    }
  }

  // update ref line
  // and return offset
  updateRefLine(_targetBbox: IBox2): {
    offsetX: number;
    offsetY: number;
  } {
    this.toDrawVLines = [];
    this.toDrawHLines = [];
    const targetBbox = bboxToBboxWithMid(_targetBbox);

    const hLineMap = this.hLineMap;
    const vLineMap = this.vLineMap;
    const sortedXs = this.sortedXs;
    const sortedYs = this.sortedYs;

    // there are no reference graphs
    if (sortedXs.length === 0 && sortedYs.length === 0) {
      return { offsetX: 0, offsetY: 0 };
    }

    let offsetX: number | undefined = undefined;
    let offsetY: number | undefined = undefined;

    // closest x
    const closestMinX = getClosestValInSortedArr(sortedXs, targetBbox.minX);
    const closestMidX = getClosestValInSortedArr(sortedXs, targetBbox.midX);
    const closestMaxX = getClosestValInSortedArr(sortedXs, targetBbox.maxX);

    const distMinX = Math.abs(closestMinX - targetBbox.minX);
    const distMidX = Math.abs(closestMidX - targetBbox.midX);
    const distMaxX = Math.abs(closestMaxX - targetBbox.maxX);

    const closestXDist = Math.min(distMinX, distMidX, distMaxX);

    // closest y
    const closestMinY = getClosestValInSortedArr(sortedYs, targetBbox.minY);
    const closestMidY = getClosestValInSortedArr(sortedYs, targetBbox.midY);
    const closestMaxY = getClosestValInSortedArr(sortedYs, targetBbox.maxY);

    const distMinY = Math.abs(closestMinY - targetBbox.minY);
    const distMidY = Math.abs(closestMidY - targetBbox.midY);
    const distMaxY = Math.abs(closestMaxY - targetBbox.maxY);

    const closestYDist = Math.min(distMinY, distMidY, distMaxY);

    const isEqualNum = (a: number, b: number) => Math.abs(a - b) < 0.00001;

    const tol =
      this.editor.setting.get('refLineTolerance') /
      this.editor.zoomManager.getZoom();

    // 先确认偏移值 offsetX
    if (closestXDist <= tol) {
      if (isEqualNum(closestXDist, distMinX)) {
        offsetX = closestMinX - targetBbox.minX;
      } else if (isEqualNum(closestXDist, distMidX)) {
        offsetX = closestMidX - targetBbox.midX;
      } else if (isEqualNum(closestXDist, distMaxX)) {
        offsetX = closestMaxX - targetBbox.maxX;
      } else {
        throw new Error('it should reach here, please put a issue to us');
      }
    }

    // 先确认偏移值 offsetY
    if (closestYDist <= tol) {
      if (isEqualNum(closestYDist, distMinY)) {
        offsetY = closestMinY - targetBbox.minY;
      } else if (isEqualNum(closestYDist, distMidY)) {
        offsetY = closestMidY - targetBbox.midY;
      } else if (isEqualNum(closestYDist, distMaxY)) {
        offsetY = closestMaxY - targetBbox.maxY;
      } else {
        throw new Error('it should reach here, please put a issue to us');
      }
    }

    const correctedTargetBbox = { ...targetBbox };
    if (offsetX !== undefined) {
      correctedTargetBbox.minX += offsetX;
      correctedTargetBbox.midX += offsetX;
      correctedTargetBbox.maxX += offsetX;
    }
    if (offsetY !== undefined) {
      correctedTargetBbox.minY += offsetY;
      correctedTargetBbox.midY += offsetY;
      correctedTargetBbox.maxY += offsetY;
    }

    if (offsetX !== undefined) {
      /*************** 左垂直的参考线 ************/
      if (
        isEqualNum(closestXDist, distMinX) &&
        isEqualNum(offsetX, closestMinX - targetBbox.minX)
      ) {
        const vLine: IVerticalLine = {
          x: closestMinX,
          ys: [],
        };

        vLine.ys.push(correctedTargetBbox.minY);
        vLine.ys.push(correctedTargetBbox.maxY);
        vLine.ys.push(...hLineMap.get(closestMinX)!);

        this.toDrawVLines.push(vLine);
      }

      /*************** 中间垂直的参考线 ************/
      if (
        isEqualNum(closestXDist, distMidX) &&
        isEqualNum(offsetX, closestMidX - targetBbox.midX)
      ) {
        const vLine: IVerticalLine = {
          x: closestMidX,
          ys: [],
        };

        vLine.ys.push(correctedTargetBbox.midY);
        vLine.ys.push(...hLineMap.get(closestMidX)!);

        this.toDrawVLines.push(vLine);
      }

      /*************** 右垂直的参考线 ************/
      if (
        isEqualNum(closestXDist, distMaxX) &&
        isEqualNum(offsetX, closestMaxX - targetBbox.maxX)
      ) {
        const vLine: IVerticalLine = {
          x: closestMaxX,
          ys: [],
        };

        vLine.ys.push(correctedTargetBbox.minY);
        vLine.ys.push(correctedTargetBbox.maxY);
        vLine.ys.push(...hLineMap.get(closestMaxX)!);

        this.toDrawVLines.push(vLine);
      }
    }

    if (offsetY !== undefined) {
      /*************** 上水平的参考线 ************/
      if (
        isEqualNum(closestYDist, distMinY) &&
        isEqualNum(offsetY, closestMinY - targetBbox.minY)
      ) {
        const hLine: IHorizontalLine = {
          y: closestMinY,
          xs: [],
        };

        hLine.xs.push(correctedTargetBbox.minX);
        hLine.xs.push(correctedTargetBbox.maxX);
        hLine.xs.push(...vLineMap.get(closestMinY)!);

        this.toDrawHLines.push(hLine);
      }
      /*************** 中间水平的参考线 ************/
      if (
        isEqualNum(closestYDist, distMidY) &&
        isEqualNum(offsetY, closestMidY - targetBbox.midY)
      ) {
        const hLine: IHorizontalLine = {
          y: closestMidY,
          xs: [],
        };

        hLine.xs.push(correctedTargetBbox.midX);
        hLine.xs.push(...vLineMap.get(closestMidY)!);

        this.toDrawHLines.push(hLine);
      }
      /*************** 下水平的参考线 ************/
      if (
        isEqualNum(closestYDist, distMaxY) &&
        isEqualNum(offsetY, closestMaxY - targetBbox.maxY)
      ) {
        const hLine: IHorizontalLine = {
          y: closestMaxY,
          xs: [],
        };

        hLine.xs.push(correctedTargetBbox.minX);
        hLine.xs.push(correctedTargetBbox.maxX);
        hLine.xs.push(...vLineMap.get(closestMaxY)!);

        this.toDrawHLines.push(hLine);
      }
    }

    return { offsetX: offsetX ?? 0, offsetY: offsetY ?? 0 };
  }

  drawRefLine(ctx: CanvasRenderingContext2D) {
    ctx.save();

    const color = this.editor.setting.get('refLineStroke');
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = this.editor.setting.get('refLineStrokeWidth');

    const pointsSet = new Set<string>();
    const pointSize = this.editor.setting.get('refLinePointSize');

    this.drawVerticalLines(ctx, pointSize, pointsSet);
    this.drawHorizontalLines(ctx, pointSize, pointsSet);

    ctx.restore();
  }

  private drawVerticalLines(
    ctx: CanvasRenderingContext2D,
    pointSize: number,
    pointsSet: Set<string>,
  ) {
    for (const vLine of this.toDrawVLines) {
      let minY = Infinity;
      let maxY = -Infinity;

      const { x } = this.editor.sceneCoordsToViewport(vLine.x, 0);
      for (const y_ of vLine.ys) {
        // TODO: optimize
        const { y } = this.editor.sceneCoordsToViewport(0, y_);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        // prevent draw same points again
        const key = `${x},${y}`;
        if (pointsSet.has(key)) {
          continue;
        }
        pointsSet.add(key);

        drawXShape(ctx, x, y, pointSize);
      }

      drawLine(ctx, x, minY, x, maxY);
    }
  }

  private drawHorizontalLines(
    ctx: CanvasRenderingContext2D,
    pointSize: number,
    pointsSet: Set<string>,
  ) {
    for (const hLine of this.toDrawHLines) {
      let minX = Infinity;
      let maxX = -Infinity;

      const { y } = this.editor.sceneCoordsToViewport(0, hLine.y);

      for (const x_ of hLine.xs) {
        const { x } = this.editor.sceneCoordsToViewport(x_, 0);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);

        // prevent draw same points again
        const key = `${x},${y}`;
        if (pointsSet.has(key)) {
          continue;
        }
        pointsSet.add(key);

        drawXShape(ctx, x, y, pointSize);
      }

      drawLine(ctx, minX, y, maxX, y);
    }
  }
}
