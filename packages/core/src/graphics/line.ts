import { parseRGBAStr } from '@suika/common';
import { applyMatrix, getPointsBbox, type IPoint, Matrix } from '@suika/geo';

import { PaintType } from '../paint';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';
import { type IDrawInfo } from './type';

export type LineAttrs = GraphicsAttrs;

/**
 * x
 * y
 * width
 * 没有 height（面板上不可编辑，并显示为 0）
 *
 */

export class SuikaLine extends SuikaGraphics<LineAttrs> {
  override type = GraphicsType.Line;

  constructor(
    attrs: Optional<LineAttrs, 'id' | 'transform'>,
    opts: IGraphicsOpts,
  ) {
    super({ ...attrs, height: 0, type: GraphicsType.Line }, opts);
  }

  override draw(drawInfo: IDrawInfo) {
    const opacity = this.getOpacity() * (drawInfo.opacity ?? 1);
    if (!this.isVisible() || opacity === 0) return;
    const { ctx } = drawInfo;
    const { width, transform, stroke, strokeWidth } = this.attrs;
    ctx.save();
    ctx.transform(...transform);
    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    if (strokeWidth) {
      ctx.lineWidth = strokeWidth;
      for (const paint of stroke ?? []) {
        switch (paint.type) {
          case PaintType.Solid: {
            ctx.strokeStyle = parseRGBAStr(paint.attrs);
            ctx.stroke();
            break;
          }
          case PaintType.Image: {
            // TODO: stroke image
          }
        }
      }

      ctx.closePath();
      ctx.restore();
    }
  }

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    ctx.transform(...this.getWorldTransform());
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.attrs.width, 0);
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.closePath();
  }

  protected override getSVGTagHead(offset?: IPoint) {
    const tf = [...this.attrs.transform];
    if (offset) {
      tf[4] += offset.x;
      tf[5] += offset.y;
    }

    const size = this.getTransformedSize();

    return `<line x1="0" y1="0" x2="${size.width}" y2="${
      size.height
    }" transform="matrix(${tf.join(' ')})"`;
  }

  protected override getFillAndStrokesToSVG() {
    return {
      fillPaints: [],
      strokePaints: this.attrs.stroke ?? [],
    };
  }

  override getLayerIconPath() {
    const containerSize = 12;
    const padding = 0.5;
    const precision = 5;

    const targetSize = containerSize - padding * 2;

    const tf = this.getWorldTransform();
    let points = [
      applyMatrix(tf, { x: 0, y: 0 }),
      applyMatrix(tf, { x: this.attrs.width, y: 0 }),
    ];

    const bbox = getPointsBbox(points);
    const bboxWidth = bbox.maxX - bbox.minX;
    const bboxHeight = bbox.maxY - bbox.minY;
    const scale = targetSize / Math.max(bboxWidth, bboxHeight);

    const matrix = new Matrix()
      .translate(-bbox.minX - bboxWidth / 2, -bbox.minY - bboxHeight / 2)
      .scale(scale, scale)
      .translate(targetSize / 2, targetSize / 2);

    points = points.map((pt) => {
      return matrix.apply(pt);
    });

    return `M${points[0].x.toFixed(precision)} ${points[0].y.toFixed(
      precision,
    )} L${points[1].x.toFixed(precision)} ${points[1].y.toFixed(precision)}`;
  }
}
