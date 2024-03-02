import { parseRGBAStr } from '@suika/common';

import { TextureType } from '../texture';
import { GraphType } from '../type';
import { rotateInCanvas } from '../utils';
import { Graph, GraphAttrs } from './graph';

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

  constructor(options: Omit<LineAttrs, 'id'>) {
    super({ ...options, height: 0, type: GraphType.Line });
  }

  override draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width, rotation, stroke, strokeWidth } = this.attrs;
    if (rotation) {
      const { x: cx, y: cy } = this.getCenter();

      rotateInCanvas(ctx, rotation, cx, cy);
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    if (strokeWidth) {
      ctx.lineWidth = strokeWidth;
      for (const texture of stroke ?? []) {
        switch (texture.type) {
          case TextureType.Solid: {
            ctx.strokeStyle = parseRGBAStr(texture.attrs);
            ctx.stroke();
            break;
          }
          case TextureType.Image: {
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
    const { x, y, width, rotation } = this.attrs;
    if (rotation) {
      const { x: cx, y: cy } = this.getCenter();

      rotateInCanvas(ctx, rotation, cx, cy);
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.closePath();
  }
}
