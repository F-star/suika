import { parseRGBAStr } from '@suika/common';
import { Graphics, Matrix } from 'pixi.js';

import { PaintType } from '../paint';
import { GraphType, type Optional } from '../type';
import { Graph, type GraphAttrs, type IGraphOpts } from './graph';

export type LineAttrs = GraphAttrs;

/**
 * x
 * y
 * width
 * 没有 height（面板上不可编辑，并显示为 0）
 *
 */

export class Line extends Graph<LineAttrs> {
  override type = GraphType.Line;

  constructor(
    attrs: Optional<LineAttrs, 'id' | 'transform'>,
    opts?: IGraphOpts,
  ) {
    super({ ...attrs, height: 0, type: GraphType.Line }, opts);
  }

  override draw(ctx: CanvasRenderingContext2D) {
    const { width, transform, stroke, strokeWidth } = this.attrs;
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
    }
  }

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    const { width, transform } = this.attrs;
    ctx.transform(...transform);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.closePath();
  }

  override drawByPixi() {
    if (!this.graphics) {
      this.graphics = new Graphics();
    }
    const graphics = this.graphics as Graphics;

    graphics.clear();

    const attrs = this.attrs;
    graphics.visible = attrs.visible ?? true;

    graphics.setFromMatrix(new Matrix(...attrs.transform));

    const strokeWidth = this.getStrokeWidth();
    for (const paint of this.attrs.stroke ?? []) {
      if (paint.type === PaintType.Solid) {
        graphics.moveTo(0, 0).lineTo(attrs.width, 0);
        graphics.stroke({ width: strokeWidth, color: paint.attrs });
      }
    }
  }
}
