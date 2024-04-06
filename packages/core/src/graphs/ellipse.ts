import { parseRGBAStr } from '@suika/common';
import { Matrix } from 'pixi.js';

import { DOUBLE_PI } from '../constant';
import { type ImgManager } from '../Img_manager';
import { PaintType } from '../paint';
import { GraphType, type Optional } from '../type';
import { Graph, type GraphAttrs } from './graph';

export type EllipseAttrs = GraphAttrs;

export class Ellipse extends Graph<EllipseAttrs> {
  override type = GraphType.Ellipse;

  constructor(options: Optional<EllipseAttrs, 'id' | 'transform'>) {
    super({ ...options, type: GraphType.Ellipse });
  }

  override hitTest(x: number, y: number, padding = 0) {
    const attrs = this.attrs;
    const cx = attrs.width / 2;
    const cy = attrs.height / 2;
    const strokeWidth = (attrs.strokeWidth || 0) / 2;
    padding = padding + strokeWidth;
    const w = attrs.width / 2 + padding;
    const h = attrs.height / 2 + padding;

    const tf = new Matrix(...this.attrs.transform);
    const rotatedHitPoint = tf.applyInverse({ x, y });

    return (
      (rotatedHitPoint.x - cx) ** 2 / w ** 2 +
        (rotatedHitPoint.y - cy) ** 2 / h ** 2 <=
      1
    );
  }

  override draw(
    ctx: CanvasRenderingContext2D,
    imgManager?: ImgManager,
    smooth?: boolean,
  ): void {
    const attrs = this.attrs;
    const cx = attrs.width / 2;
    const cy = attrs.height / 2;

    ctx.transform(...attrs.transform);

    ctx.beginPath();
    ctx.ellipse(cx, cy, attrs.width / 2, attrs.height / 2, 0, 0, DOUBLE_PI);
    for (const paint of attrs.fill ?? []) {
      if (paint.type === PaintType.Solid) {
        ctx.fillStyle = parseRGBAStr(paint.attrs);
        ctx.fill();
      } else if (paint.type === PaintType.Image) {
        if (imgManager) {
          ctx.clip();
          this.fillImage(ctx, paint, imgManager, smooth);
        } else {
          console.warn('ImgManager is not provided');
        }
      }
    }

    if (attrs.strokeWidth) {
      ctx.lineWidth = attrs.strokeWidth;
      for (const paint of attrs.stroke ?? []) {
        if (paint.type === PaintType.Solid) {
          ctx.strokeStyle = parseRGBAStr(paint.attrs);
          ctx.stroke();
        } else if (paint.type === PaintType.Image) {
          // TODO:
        }
      }
    }

    ctx.closePath();
  }

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    const { width, height, transform } = this.attrs;
    const cx = width / 2;
    const cy = height / 2;

    ctx.transform(...transform);

    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, DOUBLE_PI);
    ctx.stroke();
    ctx.closePath();
  }
}
