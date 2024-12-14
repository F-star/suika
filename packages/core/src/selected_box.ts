import { EventEmitter, remainDecimal } from '@suika/common';
import {
  distance,
  getPerpendicularPoints,
  getSweepAngle,
  type IPoint,
  isPointEqual,
  isPointInTransformedRect,
  type ITransformRect,
  Matrix,
  midPoint,
  offsetRect,
  pointSub,
  rectToVertices,
} from '@suika/geo';

import { type SuikaEditor } from './editor';

interface Events {
  hoverChange(isHover: boolean): void;
}

export class SelectedBox {
  private box: ITransformRect | null = null;
  private eventEmitter = new EventEmitter<Events>();
  private _hover = false;
  public enableDrawSizeIndicator = true;

  constructor(private editor: SuikaEditor) {}

  isHover() {
    return this._hover;
  }

  getBox(): ITransformRect | null {
    return this.box ? { ...this.box } : null;
  }

  updateBbox() {
    const selectedElements = this.editor.selectedElements;

    const count = selectedElements.size();
    if (count > 0) {
      if (count === 1) {
        const selectedGraph = selectedElements.getItems()[0];
        const rect = selectedGraph.getSize();
        this.box = {
          width: rect.width,
          height: rect.height,
          transform: selectedGraph.getWorldTransform(),
        };
      } else {
        const rect = selectedElements.getBoundingRect()!;
        this.box = {
          width: rect.width,
          height: rect.height,
          transform: [1, 0, 0, 1, rect.x, rect.y],
        };
      }
    } else {
      this.box = null;
    }

    return this.box;
  }

  draw() {
    const bbox = this.box;
    if (!bbox) {
      return;
    }

    const ctx = this.editor.ctx;

    const polygon = rectToVertices(
      {
        x: 0,
        y: 0,
        width: bbox.width,
        height: bbox.height,
      },
      bbox.transform,
    ).map((pt) => this.editor.toViewportPt(pt.x, pt.y));

    this.drawBox(ctx, polygon);
    this.drawSizeIndicator(ctx, polygon, bbox);
  }

  private drawBox(ctx: CanvasRenderingContext2D, polygon: IPoint[]) {
    const stroke = this.editor.setting.get('selectBoxStroke');
    const strokeWidth = this.editor.setting.get('selectBoxStrokeWidth');

    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  private drawSizeIndicator(
    ctx: CanvasRenderingContext2D,
    polygon: IPoint[],
    size: { width: number; height: number },
  ) {
    if (!this.enableDrawSizeIndicator) {
      return;
    }

    // too small, no render
    const minSize = this.editor.setting.get('sizeIndicatorMinSize');
    if (
      distance(polygon[0], polygon[1]) < minSize &&
      distance(polygon[1], polygon[2]) < minSize
    ) {
      return;
    }

    let bottomPt = polygon[0];
    let bottomPtIndex = 0;
    for (let i = 1; i < polygon.length; i++) {
      if (polygon[i].y > bottomPt.y) {
        bottomPt = polygon[i];
        bottomPtIndex = i;
      }
    }

    let minAngle = Infinity;
    let minAnglePt = polygon[0];
    for (let i = 0; i < polygon.length; i++) {
      if (i === bottomPtIndex || isPointEqual(polygon[i], bottomPt)) {
        continue;
      }

      let angle = getSweepAngle(
        { x: 1, y: 0 },
        pointSub(polygon[i], bottomPt),
        true,
      );
      if (angle > Math.PI / 2) {
        angle = Math.PI - angle;
      }

      if (angle < minAngle) {
        minAngle = angle;
        minAnglePt = polygon[i];
      }
    }

    const centerPt = midPoint(bottomPt, minAnglePt);
    const [p1, p2] = getPerpendicularPoints(
      [bottomPt, minAnglePt],
      centerPt,
      this.editor.setting.get('sizeIndicatorOffset'),
    );
    const targetPt = p1.y > p2.y ? p1 : p2;

    // config
    const rectRadius = this.editor.setting.get('sizeIndicatorRectRadius');
    const rectPadding = this.editor.setting.get('sizeIndicatorRectPadding');

    const numPrecision = this.editor.setting.get('sizeIndicatorNumPrecision');
    const fontColor = this.editor.setting.get('sizeIndicatorTextColor');
    const fontStyle = this.editor.setting.get('sizeIndicatorTextFontStyle');

    const width = remainDecimal(size.width, numPrecision);
    const height = remainDecimal(size.height, numPrecision);

    const textContent = `${width} x ${height}`;

    ctx.save();
    ctx.font = fontStyle;
    const textMetrics = ctx.measureText(textContent);
    const textWidth = textMetrics.width;
    const fontBoundingBoxAscent = textMetrics.fontBoundingBoxAscent;
    const textHeight =
      fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;

    const matrix = new Matrix()
      .translate(-textWidth / 2, 0)
      .rotate(getSweepAngle({ x: 0, y: 1 }, pointSub(targetPt, centerPt)))
      .translate(targetPt.x, targetPt.y);

    const fill = this.editor.setting.get('selectBoxStroke');
    ctx.fillStyle = fill;
    ctx.transform(...matrix.getArray());
    ctx.beginPath();
    const bgRect = offsetRect(
      { x: 0, y: 0, width: textWidth, height: textHeight },
      rectPadding,
    );
    ctx.roundRect(bgRect.x, bgRect.y, bgRect.width, bgRect.height, rectRadius);
    ctx.fill();

    ctx.translate(0, fontBoundingBoxAscent);
    ctx.fillStyle = fontColor;
    ctx.fillText(textContent, 0, 0);

    ctx.restore();
  }

  /** check if the point is in the selected box */
  hitTest(point: IPoint) {
    if (!this.box) {
      return false;
    }
    const TOL = 2;
    return isPointInTransformedRect(
      point,
      this.box,
      TOL / this.editor.zoomManager.getZoom(),
    );
  }

  setHover(hover: boolean) {
    if (this._hover === hover) {
      return;
    }
    this._hover = hover;
    this.eventEmitter.emit('hoverChange', hover);
  }

  setHoverByPoint(point: IPoint) {
    const hover = this.hitTest(point);
    this.setHover(hover);
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}
