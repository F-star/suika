import { SetElementsAttrs } from '../commands/set_elements_attrs';
import { Editor } from '../editor';
import { IBox, IBox2, GraphType } from '../../type';
import { calcCoverScale, genId, objectNameGenerator } from '../../utils/common';
import {
  getAbsoluteCoords,
  getElementRotatedXY,
  getRectCenterPoint,
} from '../../utils/graphics';
import { transformRotate } from '../../utils/transform';
import { DEFAULT_IMAGE, ITexture, TextureImage } from '../texture';

export interface GraphAttrs {
  type?: GraphType;
  id?: string;
  objectName?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // 颜色
  fill?: ITexture[];
  stroke?: ITexture[];
  strokeWidth?: number;
  // transform 相关
  rotation?: number;
}

export class Graph {
  type = GraphType.Graph;
  id: string;
  objectName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // color
  fill: ITexture[] = [];
  stroke: ITexture[] = [];
  strokeWidth?: number;
  // transform
  rotation?: number;
  constructor(options: GraphAttrs) {
    this.type = options.type ?? this.type;
    this.id = options.id ?? genId();

    if (options.objectName) {
      this.objectName = options.objectName;
      objectNameGenerator.setMaxIdx(options.objectName);
    } else {
      this.objectName = objectNameGenerator.gen(options.type ?? this.type);
    }

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
    if (options.strokeWidth) {
      this.strokeWidth = options.strokeWidth;
    }
    if (options.rotation) {
      this.rotation = options.rotation;
    }
  }
  getAttrs(): GraphAttrs {
    return {
      type: this.type,
      id: this.id,
      objectName: this.objectName,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      fill: this.fill,
      stroke: this.stroke,
      strokeWidth: this.strokeWidth,
      rotation: this.rotation,
    };
  }
  setAttrs(attrs: Partial<GraphAttrs>) {
    let key: keyof Partial<GraphAttrs>;
    for (key in attrs) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-explicit-any
      const self: any = this;
      self[key] = attrs[key];
    }
  }

  /**
   * AABB (axis-aligned bounding box)
   */
  getBBox(): IBox {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);
    const rotation = this.rotation;
    if (!rotation) {
      return this.getBBoxWithoutRotation();
    }

    const { x: tlX, y: tlY } = transformRotate(x, y, rotation, cx, cy); // 左上
    const { x: trX, y: trY } = transformRotate(x2, y, rotation, cx, cy); // 右上
    const { x: brX, y: brY } = transformRotate(x2, y2, rotation, cx, cy); // 右下
    const { x: blX, y: blY } = transformRotate(x, y2, rotation, cx, cy); // 右下

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
  /**
   * AABB (axis-aligned bounding box)
   */
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

    const { x: tlX, y: tlY } = transformRotate(x, y, rotation, cx, cy); // 左上
    const { x: trX, y: trY } = transformRotate(x2, y, rotation, cx, cy); // 右上
    const { x: brX, y: brY } = transformRotate(x2, y2, rotation, cx, cy); // 右下
    const { x: blX, y: blY } = transformRotate(x, y2, rotation, cx, cy); // 右下

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
    const { x, y } = transformRotate(
      rotatedX,
      rotatedY,
      -(this.rotation || 0),
      cx,
      cy,
    );
    this.x = x;
    this.y = y;
  }
  setRotatedX(rotatedX: number) {
    const { x: prevRotatedX } = getElementRotatedXY(this);
    this.x = this.x + rotatedX - prevRotatedX;
  }
  setRotatedY(rotatedY: number) {
    const { y: prevRotatedY } = getElementRotatedXY(this);
    this.y = this.y + rotatedY - prevRotatedY;
  }
  resizeAndKeepRotatedXY({
    width,
    height,
  }: {
    width?: number;
    height?: number;
  }) {
    const { x: preRotatedX, y: preRotatedY } = getElementRotatedXY(this);
    if (width) {
      this.width = width;
    }
    if (height) {
      this.height = height;
    }
    const { x: rotatedX, y: rotatedY } = getElementRotatedXY(this);
    const dx = rotatedX - preRotatedX;
    const dy = rotatedY - preRotatedY;
    this.x -= dx;
    this.y -= dy;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renderFillAndStrokeTexture(ctx: CanvasRenderingContext2D) {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  strokeTexture(ctx: CanvasRenderingContext2D) {
    throw new Error('Method not implemented.');
  }

  fillImage(ctx: CanvasRenderingContext2D, texture: TextureImage) {
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

  static dMove(graphs: Graph[], dx: number, dy: number) {
    for (const graph of graphs) {
      graph.x += dx;
      graph.y += dy;
    }
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
        prevXs,
      ),
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
        prevXs,
      ),
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
      const { x: preRotatedX, y: preRotatedY } = getElementRotatedXY(el);
      el.width = width;
      const { x: rotatedX, y: rotatedY } = getElementRotatedXY(el);
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
        prevAttrs,
      ),
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
      const { x: preRotatedX, y: preRotatedY } = getElementRotatedXY(el);
      el.height = height;
      const { x: rotatedX, y: rotatedY } = getElementRotatedXY(el);
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
        prevAttrs,
      ),
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
      new SetElementsAttrs(
        'update Rotation',
        elements,
        { rotation },
        prevAttrs,
      ),
    );
  },
};
