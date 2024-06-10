import { parseRGBAStr } from '@suika/common';
import { type IPoint, Matrix } from '@suika/geo';

import { DOUBLE_PI } from '../constant';
import { type ImgManager } from '../Img_manager';
import { PaintType } from '../paint';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';

export type EllipseAttrs = GraphicsAttrs;

export class SuikaEllipse extends SuikaGraphics<EllipseAttrs> {
  override type = GraphicsType.Ellipse;

  constructor(
    attrs: Optional<EllipseAttrs, 'id' | 'transform'>,
    opts: IGraphicsOpts,
  ) {
    super({ ...attrs, type: GraphicsType.Ellipse }, opts);
  }

  override hitTest(x: number, y: number, padding = 0) {
    const attrs = this.attrs;
    const cx = attrs.width / 2;
    const cy = attrs.height / 2;
    const strokeWidth = (attrs.strokeWidth || 0) / 2;
    padding = padding + strokeWidth;
    const w = attrs.width / 2 + padding;
    const h = attrs.height / 2 + padding;

    const tf = new Matrix(...this.getWorldTransform());
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
  ) {
    if (!this.isVisible()) return;
    const attrs = this.attrs;
    const cx = attrs.width / 2;
    const cy = attrs.height / 2;

    ctx.save();
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
    ctx.restore();
  }

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    const { width, height } = this.attrs;
    const cx = width / 2;
    const cy = height / 2;

    ctx.transform(...this.getWorldTransform());

    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, DOUBLE_PI);
    ctx.stroke();
    ctx.closePath();
  }

  override getSVGTagHead(offset?: IPoint) {
    const tf = [...this.attrs.transform];
    if (offset) {
      tf[4] += offset.x;
      tf[5] += offset.y;
    }

    const cx = this.attrs.width / 2;
    const cy = this.attrs.height / 2;

    if (this.attrs.width === this.attrs.height) {
      return `<circle cx="${cx}" cy="${cy}" r="${cx}" transform="matrix(${tf.join(
        ' ',
      )})"`;
    } else {
      return `<ellipse cx="${cx}" cy="${cy}" rx="${cx}" ry="${cy}" transform="matrix(${tf.join(
        ' ',
      )})"`;
    }
  }
}
