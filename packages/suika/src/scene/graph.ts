import { IBox } from '../type.interface';
import { genId } from '../utils/common';
import { getAbsoluteCoords } from '../utils/graphics';
import { transformRotate } from '../utils/transform';

export interface IGraph {
  x: number;
  y: number;
  width: number;
  height: number;
  // 颜色
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // transform 相关
  rotation?: number;
}


export class Graph {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  // 颜色
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // transform 相关
  rotation?: number;
  constructor(options: IGraph) {
    this.id = genId();
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;

    if (options.fill) {
      this.fill = options.fill;
    }
    if (options.stroke) {
      this.stroke = options.stroke;
    }
    if (options.rotation) {
      this.rotation = options.rotation;
    }

  }
  setAttrs(attrs: Partial<IGraph>) {
    let key: keyof Partial<IGraph>;
    for (key in attrs) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self: any = this;
      self[key] = attrs[key];
    }
  }
  getAttrs(attrKeys: Array<keyof IGraph>) {
    const attrs: Partial<IGraph> = {};
    for (let i = 0, len = attrKeys.length; i < len; i++) {
      const key = attrKeys[i];
      (attrs as any)[key] = this[key];
    }
    return attrs;
  }
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
}

export const getFill = (obj: Pick<IGraph, 'fill'>) => {
  return obj.fill || '';
};