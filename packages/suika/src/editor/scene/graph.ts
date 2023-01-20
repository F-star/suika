import { SetElementsAttrs } from '../commands/set_elements_attrs';
import { Editor } from '../editor';
import { IBox } from '../../type.interface';
import { genId } from '../../utils/common';
import {
  getAbsoluteCoords,
  getElementRotatedXY,
  getRectCenterPoint,
} from '../../utils/graphics';
import { transformRotate } from '../../utils/transform';

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
      // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-explicit-any
      const self: any = this;
      self[key] = attrs[key];
    }
  }
  getAttrs(attrKeys: Array<keyof IGraph>) {
    const attrs: Partial<IGraph> = {};
    for (let i = 0, len = attrKeys.length; i < len; i++) {
      const key = attrKeys[i];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  setRotateXY(rotatedX: number, rotatedY: number) {
    const [cx, cy] = getRectCenterPoint(this);
    const [x, y] = transformRotate(
      rotatedX,
      rotatedY,
      -(this.rotation || 0),
      cx,
      cy
    );
    this.x = x;
    this.y = y;
  }
  setRotateX(rotatedX: number) {
    const [cx, cy] = getRectCenterPoint(this);
    const [prevRotatedX, prevRotatedY] = getElementRotatedXY(this);
    const [x] = transformRotate(
      rotatedX,
      prevRotatedY,
      -(this.rotation || 0),
      cx + (rotatedX - prevRotatedX),
      cy
    );
    this.x = x;
  }
}

export const getFill = (obj: Pick<IGraph, 'fill'>) => {
  return obj.fill || '';
};

/**
 * 修改元素并保存到历史记录
 */

export const MutateElementsAndRecord = {
  setRotateX(editor: Editor, elements: Graph[], rotatedX: number) {
    if (elements.length === 0) {
      return;
    }
    // 1. 计算新的 x
    const prevXs: { x: number }[] = new Array(elements.length);
    for (let i = 0, len = elements.length; i < len; i++) {
      const element = elements[i];
      prevXs[i] = { x: element.x };
      element.setRotateX(rotatedX);
    }
    // 2. 保存到历史记录
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        elements,
        elements.map((el) => ({ x: el.x })),
        prevXs
      )
    );
  },
};
