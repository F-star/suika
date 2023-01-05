import { IBox, IRect } from '../type.interface';
import { genId } from '../utils/common';
import { getAbsoluteCoords } from '../utils/graphics';
import { transformRotate } from '../utils/transform';
import { getFill, Graph, IGraph } from './graph';

export interface RectGraph extends IGraph, IRect {}

export class Rect extends Graph {
  id: number;
  // x: number;
  // y: number;
  width: number;
  height: number;
  // fill?: string;
  // rotation?: number = 0;

  constructor(options: RectGraph) {
    super(options);
    const { width, height } = options;
    this.id = genId();
    this.width = width;
    this.height = height;

    // this.fill = fill || '';
    // TODO: 计算包围盒缓存起来
  }
  /**
   * 计算包围盒（不考虑 strokeWidth）
   * 默认不考虑旋转，但可以通过 withRotation 开启
   */
  getBBox(options?: { withRotation: boolean }): IBox {
    const withRotation = options ? options.withRotation : false; // 是否考虑旋转
    if (!withRotation || !this.rotation) {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      };
    }
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);
    const rotation = this.rotation;

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
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = getFill(this);
    // ctx.strokeStyle = this._stroke;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
