import { IBox, IRect, GraphType } from '../../type.interface';
import { rotateInCanvas } from '../../utils/canvas';
import { parseRGBAStr } from '../../utils/color';
import { getAbsoluteCoords } from '../../utils/graphics';
import { transformRotate } from '../../utils/transform';
import { DEFAULT_IMAGE, TextureType } from '../texture';
import { Graph, IGraph } from './graph';

export interface RectGraph extends IGraph, IRect {}

export class Rect extends Graph {
  type = GraphType.Rect;
  constructor(options: RectGraph) {
    super(options);
    if (!options.objectName) {
      this.objectName = 'Rectangle ' + this.id;
    }
  }
  /**
   * 计算包围盒（不考虑 strokeWidth）
   * 考虑旋转
   */
  getBBox(): IBox {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);
    const rotation = this.rotation;
    if (!rotation) {
      return this.getBBoxWithoutRotation();
    }

    const [tlX, tlY] = transformRotate(x, y, rotation, cx, cy); // 左上
    const [trX, trY] = transformRotate(x2, y, rotation, cx, cy); // 右上
    const [brX, brY] = transformRotate(x2, y2, rotation, cx, cy); // 右下
    const [blX, blY] = transformRotate(x, y2, rotation, cx, cy); // 右下

    const minX = Math.min(tlX, trX, brX, blX);
    const minY = Math.min(tlY, trY, brY, blY);
    const maxX = Math.max(tlX, trX, brX, blX);
    const maxY = Math.max(tlY, trY, brY, blY);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
  getBBoxWithoutRotation() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  fillTexture(ctx: CanvasRenderingContext2D) {
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
          const src = texture.attrs.src;
          const width = this.width;
          const height = this.height;
          let img: CanvasImageSource;
          if (src) {
            img = new Image();
            img.src = src;
            // TODO: rerender when image loaded, but notice endless loop
          } else {
            img = DEFAULT_IMAGE;
            ctx.imageSmoothingEnabled = false;
          }

          // reference: https://mp.weixin.qq.com/s/TSpZv_0VJtxPTCCzEqDl8Q
          const scale = calcCoverScale(img.width, img.height, width, height);

          const sx = img.width / 2 - width / scale / 2;
          const sy = img.height / 2 - height / scale / 2;

          ctx.drawImage(
            img,
            sx,
            sy,
            width / scale,
            height / scale,
            this.x,
            this.y,
            width,
            height,
          );
        }
      }
    }
    ctx.closePath();
  }
}

const calcCoverScale = (
  w: number,
  h: number,
  cw: number,
  ch: number,
): number => {
  if (w === 0 || h === 0) return 1;
  const scaleW = cw / w;
  const scaleH = ch / h;
  const scale = Math.max(scaleW, scaleH);
  return scale;
};
