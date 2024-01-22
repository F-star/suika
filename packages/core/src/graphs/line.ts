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

export class Line extends Graph {
  constructor(options: LineAttrs) {
    super({ ...options, type: GraphType.Line });
    this.height = 0;
  }

  override draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width, rotation } = this;
    if (rotation) {
      const { x: cx, y: cy } = this.getCenter();

      rotateInCanvas(ctx, rotation, cx, cy);
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    if (this.strokeWidth) {
      ctx.lineWidth = this.strokeWidth;
      for (const texture of this.stroke) {
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
    const { x, y, width, rotation } = this;
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
