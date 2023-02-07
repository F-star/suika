import { IRect } from '../../type.interface';
import { forEach } from '../../utils/array_util';
import { rotateInCanvas } from '../../utils/canvas';
import { parseRGBAStr } from '../../utils/color';
import { Graph, IGraph } from './graph';

export interface RectGraph extends IGraph, IRect {}

export class Rect extends Graph {
  constructor(options: RectGraph) {
    super(options);
  }
  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, rotation, fill } = this;
    if (rotation) {
      const cx = x + width / 2;
      const cy = y + height / 2;
      ctx.save();
      rotateInCanvas(ctx, rotation, cx, cy);
    }
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    forEach(fill, (val) => {
      ctx.fillStyle = parseRGBAStr(val);
      ctx.fill();
    });
    ctx.closePath();
    if (rotation) {
      ctx.restore();
    }
  }
}
