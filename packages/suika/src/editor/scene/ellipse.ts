import { DOUBLE_PI } from '../../constant';
import { IBox, GraphType } from '../../type.interface';
import { parseRGBAStr } from '../../utils/color';
import { TextureType } from '../texture';
import { Graph, IGraph } from './graph';

export interface IEllipseGraph extends IGraph, IBox {}

export class Ellipse extends Graph {
  type = GraphType.Ellipse;
  constructor(options: IEllipseGraph) {
    super(options);
    if (!options.objectName) {
      this.objectName = 'Ellipse ' + this.id;
    }
  }
  fillTexture(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      this.width / 2,
      this.height / 2,
      this.rotation || 0,
      0,
      DOUBLE_PI,
    );
    for (const texture of this.fill) {
      if (texture.type === TextureType.Solid) {
        ctx.fillStyle = parseRGBAStr(texture.attrs);
        ctx.fill();
      }
      // TODO: Fill with image
    }
    ctx.closePath();
  }
}
