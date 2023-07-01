import { DOUBLE_PI } from '../../constant';
import { IBox, GraphType } from '../../type.interface';
import { rotateInCanvas } from '../../utils/canvas';
import { parseRGBAStr } from '../../utils/color';
import { TextureType } from '../texture';
import { Graph, GraphAttrs } from './graph';

export interface EllipseAttrs extends GraphAttrs, IBox {}

export class Ellipse extends Graph {
  type = GraphType.Ellipse;
  constructor(options: EllipseAttrs) {
    super(options);
    if (!options.objectName) {
      this.objectName = 'Ellipse ' + this.id;
    }
  }
  fillTexture(ctx: CanvasRenderingContext2D): void {
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
        ctx.clip();
        this.fillImage(ctx, texture);
      }
    }
    ctx.closePath();
  }
}
