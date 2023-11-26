import { DOUBLE_PI } from '../../constant';
import { GraphType } from '../../type';
import { rotateInCanvas } from '../../utils/canvas';
import { parseRGBAStr } from '../../utils/color';
import { transformRotate } from '@suika/geo';
import { ImgManager } from '../Img_manager';
import { TextureType } from '../texture';
import { Graph, GraphAttrs } from './graph';

export type EllipseAttrs = GraphAttrs;

export class Ellipse extends Graph {
  constructor(options: EllipseAttrs) {
    super({ ...options, type: GraphType.Ellipse });
  }

  override hitTest(x: number, y: number, padding = 0) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const strokeWidth = (this.strokeWidth || 0) / 2;
    padding = padding + strokeWidth;
    const w = this.width / 2 + padding;
    const h = this.height / 2 + padding;

    const rotatedHitPoint = this.rotation
      ? transformRotate(x, y, -this.rotation, cx, cy)
      : { x, y };

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
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    if (this.rotation) {
      rotateInCanvas(ctx, this.rotation, cx, cy);
    }

    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 2, this.height / 2, 0, 0, DOUBLE_PI);
    for (const texture of this.fill) {
      if (texture.type === TextureType.Solid) {
        ctx.fillStyle = parseRGBAStr(texture.attrs);
        ctx.fill();
      } else if (texture.type === TextureType.Image) {
        if (imgManager) {
          ctx.clip();
          this.fillImage(ctx, texture, imgManager, smooth);
        } else {
          console.warn('ImgManager is not provided');
        }
      }
    }

    if (this.strokeWidth) {
      ctx.lineWidth = this.strokeWidth;
      for (const texture of this.stroke) {
        if (texture.type === TextureType.Solid) {
          ctx.strokeStyle = parseRGBAStr(texture.attrs);
          ctx.stroke();
        } else if (texture.type === TextureType.Image) {
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
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    if (this.rotation) {
      rotateInCanvas(ctx, this.rotation, cx, cy);
    }

    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 2, this.height / 2, 0, 0, DOUBLE_PI);
    ctx.stroke();
    ctx.closePath();
  }
}
