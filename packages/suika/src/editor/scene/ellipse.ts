import { forEach } from 'lodash';
import { IBox } from '../../type.interface';
import { parseRGBAStr } from '../../utils/color';
import { Graph, IGraph } from './graph';

const DOUBLE_PI = Math.PI * 2;

export interface IEllipseGraph extends IGraph, IBox {}

export class Ellipse extends Graph {
  constructor(options: IEllipseGraph) {
    super(options);
  }
  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, rotation, fill } = this;
    const cx = x + width / 2;
    const cy = y + height / 2;

    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      width / 2,
      height / 2,
      rotation || 0,
      0,
      DOUBLE_PI
    );
    forEach(fill, (val) => {
      ctx.fillStyle = parseRGBAStr(val);
      ctx.fill();
    });
    ctx.closePath();
  }
}
