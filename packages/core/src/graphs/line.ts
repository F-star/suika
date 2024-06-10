import { parseRGBAStr } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { PaintType } from '../paint';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';

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

  override draw(ctx: CanvasRenderingContext2D) {
    if (!this.isVisible()) return;
    const { width, transform, stroke, strokeWidth } = this.attrs;
    ctx.save();
    ctx.transform(...transform);
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
}
