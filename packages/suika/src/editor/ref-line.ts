import { Editor } from './editor';
import { IBox2, IBoxWithMid, IPoint } from '../type';
import { bboxToBboxWithMid, isRectIntersect2 } from '../utils/graphics';
import { getClosestValInSortedArr } from '../utils/common';
import { drawLine, drawXShape } from '../utils/canvas';

/**
 * reference line
 */
export class RefLine {
  private xMap = new Map<number, IBoxWithMid[]>();
  private yMap = new Map<number, IBoxWithMid[]>();
  private sortedXs: number[] = [];
  private sortedYs: number[] = [];

  /**
   * some vertical lines with points. e.g:
   * [
   *  [0, 0], [9, 0], [2, 0],
   *  [9, 5], [10, 5]
   * ]
   */
  refVLines: IPoint[][] = [];
  refHLines: IPoint[][] = [];

  constructor(private editor: Editor) {}

  // 计算图形的 bbox 缓存为两个 map，一个 map 的 key 是 x，value 为 bbox
  // 另一个 map 的 key 为 y 值
  cacheXYToBbox() {
    this.clear();

    const xMap = this.xMap;
    const yMap = this.yMap;

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

      this.addBboxToMap(xMap, bbox.minX, bbox);
      this.addBboxToMap(xMap, bbox.midX, bbox);
      this.addBboxToMap(xMap, bbox.maxX, bbox);

      this.addBboxToMap(yMap, bbox.minY, bbox);
      this.addBboxToMap(yMap, bbox.midY, bbox);
      this.addBboxToMap(yMap, bbox.maxY, bbox);
    }

    this.sortedXs = Array.from(xMap.keys()).sort((a, b) => a - b);
    this.sortedYs = Array.from(yMap.keys()).sort((a, b) => a - b);
  }
  clear() {
    this.xMap.clear();
    this.yMap.clear();
    this.sortedXs = [];
    this.sortedYs = [];
    this.refVLines = [];
    this.refHLines = [];
  }
  private addBboxToMap(
    m: Map<number, IBoxWithMid[]>,
    num: number,
    bbox: IBoxWithMid,
  ) {
    const bboxes = m.get(num);
    if (bboxes) {
      bboxes.push(bbox);
    } else {
      m.set(num, [bbox]);
    }
  }

  // update ref line
  // and return offset
  updateRefLine(_targetBbox: IBox2): {
    offsetX: number;
    offsetY: number;
  } {
    this.refVLines = [];
    this.refHLines = [];
    const targetBbox = bboxToBboxWithMid(_targetBbox);

    let offsetX: number | undefined = undefined;
    let offsetY: number | undefined = undefined;
    const xMap = this.xMap;
    const yMap = this.yMap;
    const sortedXs = this.sortedXs;
    const sortedYs = this.sortedYs;

    // there are no reference graphs
    if (sortedXs.length === 0) {
      return { offsetX: 0, offsetY: 0 };
    }

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
        const points: IPoint[] = [];
        // points of targetBbox
        points.push({ x: closestMinX, y: correctedTargetBbox.minY });
        points.push({ x: closestMinX, y: correctedTargetBbox.maxY });
        // points of reference graphs
        for (const b of xMap.get(closestMinX)!) {
          points.push({ x: closestMinX, y: b.minY });
          points.push({ x: closestMinX, y: b.maxY });
        }
        this.refVLines.push(points);
      }

      /*************** 中间垂直的参考线 ************/
      if (
        isEqualNum(closestXDist, distMidX) &&
        isEqualNum(offsetX, closestMidX - targetBbox.midX)
      ) {
        const points: IPoint[] = [];
        points.push({
          x: closestMidX,
          y: correctedTargetBbox.midY,
        });
        for (const b of xMap.get(closestMidX)!) {
          points.push({ x: closestMidX, y: b.minY });
          points.push({ x: closestMidX, y: b.maxY });
        }
        this.refVLines.push(points);
      }

      /*************** 右垂直的参考线 ************/
      if (
        isEqualNum(closestXDist, distMaxX) &&
        isEqualNum(offsetX, closestMaxX - targetBbox.maxX)
      ) {
        const points: IPoint[] = [];
        points.push({ x: closestMaxX, y: correctedTargetBbox.minY });
        points.push({ x: closestMaxX, y: correctedTargetBbox.maxY });
        for (const b of xMap.get(closestMaxX)!) {
          points.push({ x: closestMaxX, y: b.minY });
          points.push({ x: closestMaxX, y: b.maxY });
        }
        this.refVLines.push(points);
      }
    }

    if (offsetY !== undefined) {
      if (
        isEqualNum(closestYDist, distMinY) &&
        isEqualNum(offsetY, closestMinY - targetBbox.minY)
      ) {
        offsetY = closestMinY - targetBbox.minY;
        /*************** 上水平的参考线 ************/
        const points: IPoint[] = [];
        // 自己的点也放进去
        points.push({ x: correctedTargetBbox.minX, y: closestMinY });
        points.push({ x: correctedTargetBbox.maxX, y: closestMinY });
        for (const b of yMap.get(closestMinY)!) {
          points.push({ x: b.minX, y: closestMinY });
          points.push({ x: b.maxX, y: closestMinY });
        }
        this.refHLines.push(points);
      }
      /*************** 中间水平的参考线 ************/
      if (
        isEqualNum(closestYDist, distMidY) &&
        isEqualNum(offsetY, closestMidY - targetBbox.midY)
      ) {
        const points: IPoint[] = [];
        points.push({
          x: correctedTargetBbox.midX,
          y: closestMidY,
        });
        for (const b of yMap.get(closestMidY)!) {
          points.push({ x: b.minX, y: closestMidY });
          points.push({ x: b.maxX, y: closestMidY });
        }
        this.refHLines.push(points);
      }
      /*************** 下水平的参考线 ************/
      if (
        isEqualNum(closestYDist, distMaxY) &&
        isEqualNum(offsetY, closestMaxY - targetBbox.maxY)
      ) {
        const points: IPoint[] = [];
        points.push({ x: correctedTargetBbox.minX, y: closestMaxY });
        points.push({ x: correctedTargetBbox.maxX, y: closestMaxY });
        for (const b of yMap.get(closestMaxY)!) {
          points.push({ x: b.minX, y: closestMaxY });
          points.push({ x: b.maxX, y: closestMaxY });
        }
        this.refHLines.push(points);
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
    for (const pts of this.refVLines) {
      let min = Infinity;
      let max = -Infinity;
      for (const p of pts) {
        const { x, y } = this.editor.sceneCoordsToViewport(p.x, p.y);
        min = Math.min(min, y);
        max = Math.max(max, y);

        // prevent draw same points again
        const key = `${x},${y}`;
        if (pointsSet.has(key)) {
          continue;
        }
        pointsSet.add(key);

        drawXShape(ctx, x, y, pointSize);
      }

      const { x: p0x } = this.editor.sceneCoordsToViewport(pts[0].x, 0);
      drawLine(ctx, p0x, min, p0x, max);
    }
  }

  private drawHorizontalLines(
    ctx: CanvasRenderingContext2D,
    pointSize: number,
    pointsSet: Set<string>,
  ) {
    for (const pts of this.refHLines) {
      let min = Infinity;
      let max = -Infinity;
      for (const p of pts) {
        const { x, y } = this.editor.sceneCoordsToViewport(p.x, p.y);
        min = Math.min(min, x);
        max = Math.max(max, x);

        // prevent draw same points again
        const key = `${x},${y}`;
        if (pointsSet.has(key)) {
          continue;
        }
        pointsSet.add(key);

        drawXShape(ctx, x, y, pointSize);
      }

      const { y: p0y } = this.editor.sceneCoordsToViewport(0, pts[0].y);
      drawLine(ctx, min, p0y, max, p0y);
    }
  }
}
