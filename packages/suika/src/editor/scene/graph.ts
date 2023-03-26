import { SetElementsAttrs } from '../commands/set_elements_attrs';
import { Editor } from '../editor';
import { IBox, IBox2 } from '../../type.interface';
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
  fill?: IRGBA[];
  stroke?: string;
  strokeWidth?: number;
  // transform 相关
  rotation?: number;
}

export interface IRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export class Graph {
  id: string;
  objectName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // color
  fill: IRGBA[] = [];
  stroke?: string;
  strokeWidth?: number;
  // transform
  rotation?: number;
  constructor(options: IGraph) {
    this.id = genId();
    this.objectName = 'Graph ' + this.id;
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
  getBBox2(): IBox2 {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);
    const rotation = this.rotation;
    if (!rotation) {
      const box = this.getBBoxWithoutRotation();
      return {
        minX: box.x,
        minY: box.y,
        maxX: box.x + box.width,
        maxY: box.y + box.height,
      };
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
      minX,
      minY,
      maxX,
      maxY,
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
  setRotatedX(rotatedX: number) {
    const [prevRotatedX] = getElementRotatedXY(this);
    this.x = this.x + rotatedX - prevRotatedX;
  }
  setRotatedY(rotatedY: number) {
    const [, prevRotatedY] = getElementRotatedXY(this);
    this.y = this.y + rotatedY - prevRotatedY;
  }
}

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
      element.setRotatedX(rotatedX);
    }
    // 2. 保存到历史记录
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'Update X of Elements',
        elements,
        elements.map((el) => ({ x: el.x })),
        prevXs
      )
    );
  },
  setRotateY(editor: Editor, elements: Graph[], rotatedY: number) {
    if (elements.length === 0) {
      return;
    }
    // 1. 计算新的 x
    const prevXs: { y: number }[] = new Array(elements.length);
    for (let i = 0, len = elements.length; i < len; i++) {
      const element = elements[i];
      prevXs[i] = { y: element.y };
      element.setRotatedY(rotatedY);
    }
    // 2. 保存到历史记录
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'Update Y of Elements',
        elements,
        elements.map((el) => ({ y: el.y })),
        prevXs
      )
    );
  },
  setWidth(editor: Editor, elements: Graph[], width: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({
      x: el.x,
      y: el.y,
      width: el.width,
    }));
    elements.forEach((el) => {
      const [preRotatedX, preRotatedY] = getElementRotatedXY(el);
      el.width = width;
      const [rotatedX, rotatedY] = getElementRotatedXY(el);
      const dx = rotatedX - preRotatedX;
      const dy = rotatedY - preRotatedY;
      el.x -= dx;
      el.y -= dy;
    });
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'Update Width of Elements',
        elements,
        elements.map((el) => ({ width: el.width, x: el.x, y: el.y })),
        prevAttrs
      )
    );
  },
  setHeight(editor: Editor, elements: Graph[], height: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({
      x: el.x,
      y: el.y,
      height: el.height,
    }));
    elements.forEach((el) => {
      const [preRotatedX, preRotatedY] = getElementRotatedXY(el);
      el.height = height;
      const [rotatedX, rotatedY] = getElementRotatedXY(el);
      const dx = rotatedX - preRotatedX;
      const dy = rotatedY - preRotatedY;
      el.x -= dx;
      el.y -= dy;
    });
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'update Height of Elements',
        elements,
        elements.map((el) => ({ height: el.height, x: el.x, y: el.y })),
        prevAttrs
      )
    );
  },
  setRotation(editor: Editor, elements: Graph[], rotation: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({ rotation: el.rotation || 0 }));
    elements.forEach((el) => {
      el.rotation = rotation;
    });
    editor.commandManager.pushCommand(
      new SetElementsAttrs('update Rotation', elements, { rotation }, prevAttrs)
    );
  },
};
