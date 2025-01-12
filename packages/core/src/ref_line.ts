import {
  arrMap,
  forEach,
  getClosestTimesVal,
  getClosestValInSortedArr,
} from '@suika/common';
import {
  calcRectBbox,
  type IPoint,
  isBoxIntersect,
  type ITransformRect,
  mergeBoxes,
  rectToVertices,
} from '@suika/geo';

import { type SuikaEditor } from './editor';
import { isFrameGraphics, type SuikaGraphics } from './graphics';
import { isCanvasGraphics } from './graphics/canvas';
import { type IHorizontalLine, type IVerticalLine } from './type';
import {
  bboxToBboxWithMid,
  drawLine,
  drawXShape,
  pointsToHLines,
  pointsToVLines,
} from './utils';

/**
 * reference line
 *
 * reference: https://mp.weixin.qq.com/s/-IjHEw_W0JjnSRD224Orig
 */
export class RefLine {
  /**
   * 参考图形产生的垂直参照线。对于其中的同一条线，x 相同（作为 key），y 不同（作为 value）
   */
  private vRefLineMap = new Map<number, Set<number>>();
  /**
   * 参考图形产生的水平照线，对于其中的同一条线，y 相同（作为 key），x 不同（作为 value）
   */
  private hRefLineMap = new Map<number, Set<number>>();

  private sortedXs: number[] = []; // 对 vRefLineMap 的 key 排序
  private sortedYs: number[] = []; // 对 hRefLineMap 的 key 排序

  private toDrawVLines: IVerticalLine[] = []; // 等待绘制的垂直参照线
  private toDrawHLines: IHorizontalLine[] = []; // 等待绘制的水平参照线

  constructor(private editor: SuikaEditor) {}

  /**
   * cache reference line of graphics in viewport
   */
  cacheGraphicsRefLines() {
    this.clear();

    const vRefLineMap = this.vRefLineMap;
    const hRefLineMap = this.hRefLineMap;

    const selectIdSet = this.editor.selectedElements.getIdSet();
    const viewportBbox = this.editor.viewportManager.getBbox();

    const refGraphicsSet = new Set<SuikaGraphics>();
    this.editor.doc.getCurrCanvas().forEachVisibleChildNode((graphics) => {
      if (
        isCanvasGraphics(graphics) ||
        (isFrameGraphics(graphics) && graphics.isGroup())
      ) {
        return;
      }
      refGraphicsSet.add(graphics);
    });

    const selectedItems = this.editor.selectedElements.getItems();
    for (const selectedItem of selectedItems) {
      selectedItem.forEachVisibleChildNode((graphics) => {
        if (refGraphicsSet.has(graphics)) {
          refGraphicsSet.delete(graphics);
        }
      });
    }

    for (const graphics of refGraphicsSet) {
      if (selectIdSet.has(graphics.attrs.id)) {
        continue;
      }

      const bbox = bboxToBboxWithMid(graphics.getBbox());
      if (!isBoxIntersect(viewportBbox, bbox)) {
        continue;
      }

      const setting = this.editor.setting;
      if (setting.get('snapToGrid')) {
        const gridSnapSpacingX = setting.get('gridSnapX');
        const gridSnapSpacingY = setting.get('gridSnapY');
        bbox.minX = getClosestTimesVal(bbox.minX, gridSnapSpacingX);
        bbox.minY = getClosestTimesVal(bbox.minY, gridSnapSpacingY);
        bbox.midX = getClosestTimesVal(bbox.midX, gridSnapSpacingX);
        bbox.midY = getClosestTimesVal(bbox.midY, gridSnapSpacingY);
        bbox.maxX = getClosestTimesVal(bbox.maxX, gridSnapSpacingX);
        bbox.maxY = getClosestTimesVal(bbox.maxY, gridSnapSpacingY);
      }

      // bbox 中水平线
      RefLine.addRefLinesToMap(vRefLineMap, bbox.midX, [bbox.minY, bbox.maxY]);
      // bbox 中垂直线
      RefLine.addRefLinesToMap(hRefLineMap, bbox.midY, [bbox.minX, bbox.maxX]);

      /**
       * 获取旋转后4个顶点的坐标
       *      top
       *     /   \
       *   /       \
       * left      right
       *   \       /
       *    \    /
       *    bottom
       *
       * special when rotate 90 degree:
       *
       * top(left) ---------- right(top)
       *      |                 |
       * left(bottom) ------- bottom(right)
       *
       * top 和 bottom 要绘制水平参考线，不要绘制垂直参照线
       * left 和 right 要绘制垂直参照线，不要绘制水平参照线
       */
      const bboxVerts = graphics.getWorldBboxVerts();

      if (setting.get('snapToGrid')) {
        const gridSnapSpacingX = setting.get('gridSnapX');
        const gridSnapSpacingY = setting.get('gridSnapY');
        for (const vert of bboxVerts) {
          vert.x = getClosestTimesVal(vert.x, gridSnapSpacingX);
          vert.y = getClosestTimesVal(vert.y, gridSnapSpacingY);
        }
      }

      const top = bboxVerts.filter((p) => p.x === bbox.minX);
      const bottom = bboxVerts.filter((p) => p.x === bbox.maxX);
      const left = bboxVerts.filter((p) => p.y === bbox.minY);
      const right = bboxVerts.filter((p) => p.y === bbox.maxY);

      // top 和 bottom 要绘制水平参考线，不要绘制垂直参照线
      for (const p of [...top, ...bottom]) {
        RefLine.addRefLinesToMap(vRefLineMap, p.x, [p.y]);
      }
      // left 和 right 要绘制垂直参照线，不要绘制水平参照线
      for (const p of [...left, ...right]) {
        RefLine.addRefLinesToMap(hRefLineMap, p.y, [p.x]);
      }
    }

    this.sortedXs = Array.from(vRefLineMap.keys()).sort((a, b) => a - b);
    this.sortedYs = Array.from(hRefLineMap.keys()).sort((a, b) => a - b);
  }
  clear() {
    this.vRefLineMap.clear();
    this.hRefLineMap.clear();
    this.sortedXs = [];
    this.sortedYs = [];
    this.toDrawVLines = [];
    this.toDrawHLines = [];
  }
  static addRefLinesToMap(
    m: Map<number, Set<number>>,
    xOrY: number,
    xsOrYs: number[],
  ) {
    const line = m.get(xOrY);
    if (line) {
      for (const xOrY of xsOrYs) {
        line.add(xOrY);
      }
    } else {
      m.set(xOrY, new Set(xsOrYs));
    }
  }

  static getGraphicsTargetPoints(record: Map<string, ITransformRect>) {
    let targetPoints: IPoint[] = [];
    // 选中的为单个图形，要以旋转后的 4 个顶点和中心点为目标线
    if (record.size === 1) {
      const { width, height, transform } = Array.from(record.values())[0];
      const points = rectToVertices(
        { x: 0, y: 0, width: width, height: height },
        transform,
      );
      points.push({
        x: (points[0].x + points[2].x) / 2,
        y: (points[0].y + points[2].y) / 2,
      });
      return points;
    } else {
      const targetBbox = bboxToBboxWithMid(
        mergeBoxes(
          Array.from(record.values()).map((item) => calcRectBbox(item)),
        ),
      );

      targetPoints = [
        { x: targetBbox.minX, y: targetBbox.minY },
        { x: targetBbox.minX, y: targetBbox.maxY },

        { x: targetBbox.maxX, y: targetBbox.minY },
        { x: targetBbox.maxX, y: targetBbox.maxY },

        { x: targetBbox.midX, y: targetBbox.midY },
      ];
    }
    return targetPoints;
  }

  /**
   * update ref line
   * and return offset
   */
  getGraphicsSnapOffset(targetPoints: IPoint[]): IPoint | undefined {
    this.toDrawVLines = [];
    this.toDrawHLines = [];

    let vTargetLines = pointsToVLines(targetPoints); // 目标矩形的垂直线
    let vTargetLineKeys = Array.from(vTargetLines.keys()); // 目标矩形的垂直线的 x 坐标
    let hTargetLines = pointsToHLines(targetPoints); // 目标矩形的水平线
    let hTargetLineKeys = Array.from(hTargetLines.keys()); // 目标矩形的水平线的 y 坐标

    const vRefLineMap = this.vRefLineMap;
    const hRefLineMap = this.hRefLineMap;
    const sortedXs = this.sortedXs;
    const sortedYs = this.sortedYs;

    // there are no reference graphs
    if (sortedXs.length === 0 && sortedYs.length === 0) {
      return undefined;
    }

    let offsetX: number | undefined = undefined;
    let offsetY: number | undefined = undefined;

    const closestXs = arrMap(vTargetLineKeys, (x) =>
      getClosestValInSortedArr(sortedXs, x),
    );
    // 目标矩形的每个 x 坐标离它们最近的参照线的差值
    const closestXDiffs = arrMap(vTargetLineKeys, (x, i) => closestXs[i] - x);
    const closestXDist = Math.min(
      ...arrMap(closestXDiffs, (item) => Math.abs(item)),
    );

    const closestYs = arrMap(hTargetLineKeys, (y) =>
      getClosestValInSortedArr(sortedYs, y),
    );
    // 目标矩形的每个 y 坐标离它们最近的参照线的差值
    const closestYDiffs = arrMap(hTargetLineKeys, (y, i) => closestYs[i] - y);
    const closestYDist = Math.min(
      ...arrMap(closestYDiffs, (item) => Math.abs(item)),
    );

    const isEqualNum = (a: number, b: number) => Math.abs(a - b) < 0.00001;

    const tol =
      this.editor.setting.get('refLineTolerance') /
      this.editor.zoomManager.getZoom();

    // 确定最终偏移值 offsetX
    if (closestXDist <= tol) {
      for (const closestXDiff of closestXDiffs) {
        if (isEqualNum(closestXDist, Math.abs(closestXDiff))) {
          offsetX = closestXDiff;
          break;
        }
      }
      if (offsetX === undefined) {
        throw new Error('it should not reach here, please put a issue to us');
      }
    }

    // 再确认偏移值 offsetY
    if (closestYDist <= tol) {
      for (const closestYDiff of closestYDiffs) {
        if (isEqualNum(closestYDist, Math.abs(closestYDiff))) {
          offsetY = closestYDiff;
          break;
        }
      }
      if (offsetY === undefined) {
        throw new Error('it should not reach here, please put a issue to us');
      }
    }

    const correctedTargetPoints: IPoint[] = arrMap(targetPoints, (p) => ({
      x: p.x + (offsetX ?? 0),
      y: p.y + (offsetY ?? 0),
    }));

    vTargetLines = pointsToVLines(correctedTargetPoints);
    vTargetLineKeys = Array.from(vTargetLines.keys()); // 对应 x

    if (offsetX !== undefined) {
      /*************** 标记需要绘制的垂直参考线 ************/
      forEach(vTargetLineKeys, (y, i) => {
        if (isEqualNum(offsetX!, closestXDiffs[i])) {
          const vLine: IVerticalLine = {
            x: closestXs[i],
            ys: [],
          };

          vLine.ys.push(...vTargetLines.get(y)!);
          vLine.ys.push(...Array.from(vRefLineMap.get(y)! ?? []));
          this.toDrawVLines.push(vLine);
        }
      });
    }

    if (offsetY !== undefined) {
      /*************** 标记需要绘制的水平参考线 ************/
      hTargetLines = pointsToHLines(correctedTargetPoints);
      hTargetLineKeys = Array.from(hTargetLines.keys()); // 对应 y

      forEach(hTargetLineKeys, (x, i) => {
        if (isEqualNum(offsetY!, closestYDiffs[i])) {
          const hLine: IHorizontalLine = {
            y: closestYs[i],
            xs: [],
          };

          hLine.xs.push(...hTargetLines.get(x)!);
          hLine.xs.push(...Array.from(hRefLineMap.get(x) ?? []));

          this.toDrawHLines.push(hLine);
        }
      });
    }

    return { x: offsetX ?? 0, y: offsetY ?? 0 };
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

      const { x } = this.editor.toViewportPt(vLine.x, 0);
      for (const y_ of vLine.ys) {
        // TODO: optimize
        const { y } = this.editor.toViewportPt(0, y_);
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

      const { y } = this.editor.toViewportPt(0, hLine.y);

      for (const x_ of hLine.xs) {
        const { x } = this.editor.toViewportPt(x_, 0);
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
