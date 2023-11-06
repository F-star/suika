import { GraphType } from '../../type';
import { rotateInCanvas } from '../../utils/canvas';
import { parseRGBAStr } from '../../utils/color';
import { ImgManager } from '../Img_manager';
import { TextureType } from '../texture';
import { Graph, GraphAttrs } from './graph';

export type RectAttrs = GraphAttrs;

export class Rect extends Graph {
  constructor(options: RectAttrs) {
    super({ ...options, type: GraphType.Rect });
  }

  override draw(
    ctx: CanvasRenderingContext2D,
    imgManager?: ImgManager,
    smooth?: boolean,
  ) {
    if (this.rotation) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;

      rotateInCanvas(ctx, this.rotation, cx, cy);
    }
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    for (const texture of this.fill) {
      switch (texture.type) {
        case TextureType.Solid: {
          ctx.fillStyle = parseRGBAStr(texture.attrs);
          ctx.fill();
          break;
        }
        case TextureType.Image: {
          if (imgManager) {
            this.fillImage(ctx, texture, imgManager, smooth);
          } else {
            console.warn('ImgManager is not provided');
          }
        }
      }
    }
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
    }
    ctx.closePath();
  }
}
