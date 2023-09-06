import { SetElementsAttrs } from '../commands/set_elements_attrs';
import { Editor } from '../editor';
import {
  IBox,
  IBox2,
  GraphType,
  IPoint,
  IBox2WithRotation as IBoxWithRotation,
} from '../../type';
import { calcCoverScale, genId, objectNameGenerator } from '../../utils/common';
import {
  getAbsoluteCoords,
  getElementRotatedXY,
  getRectCenterPoint,
  isPointInRect,
  normalizeRect,
} from '../../utils/graphics';
import { transformRotate } from '../../utils/transform';
import { DEFAULT_IMAGE, ITexture, TextureImage } from '../texture';
import { ImgManager } from '../Img_manager';

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
   * 计算包围盒（不考虑 strokeWidth）
   * 考虑旋转
   */
  getBBox(): IBox {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);
    const rotation = this.rotation;
    if (!rotation) {
      return this.getBBoxWithoutRotation();
    }

    const { x: nwX, y: nwY } = transformRotate(x, y, rotation, cx, cy); // 左上
    const { x: neX, y: neY } = transformRotate(x2, y, rotation, cx, cy); // 右上
    const { x: seX, y: seY } = transformRotate(x2, y2, rotation, cx, cy); // 右下
    const { x: swX, y: swY } = transformRotate(x, y2, rotation, cx, cy); // 右下

    const minX = Math.min(nwX, neX, seX, swX);
    const minY = Math.min(nwY, neY, seY, swY);
    const maxX = Math.max(nwX, neX, seX, swX);
    const maxY = Math.max(nwY, neY, seY, swY);
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
  getBboxVerts(): [IPoint, IPoint, IPoint, IPoint] {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);

    const rotation = this.rotation;
    if (!rotation) {
      return [
        { x: x, y: y },
        { x: x2, y: y },
        { x: x2, y: y2 },
        { x: x, y: y2 },
      ];
    }

    const nw = transformRotate(x, y, rotation, cx, cy); // 左上
    const ne = transformRotate(x2, y, rotation, cx, cy); // 右上
    const se = transformRotate(x2, y2, rotation, cx, cy); // 右下
    const sw = transformRotate(x, y2, rotation, cx, cy); // 右下

    return [nw, ne, se, sw];
  }
  getBBoxWithoutRotation() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }
  setRotateXY(rotatedX: number, rotatedY: number) {
    const { x: cx, y: cy } = this.getCenter();
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
  hitTest(x: number, y: number, padding = 0) {
    const bBox = this.getBBoxWithoutRotation();
    const [cx, cy] = getRectCenterPoint(bBox);
    const rotatedHitPoint = this.rotation
      ? transformRotate(x, y, -this.rotation, cx, cy)
      : { x, y };

    return isPointInRect(rotatedHitPoint, bBox, padding);
  }
  setRotatedX(rotatedX: number) {
    const { x: prevRotatedX } = getElementRotatedXY(this);
    this.x = this.x + rotatedX - prevRotatedX;
  }
  setRotatedY(rotatedY: number) {
    const { y: prevRotatedY } = getElementRotatedXY(this);
    this.y = this.y + rotatedY - prevRotatedY;
  }
  movePoint(
    type: 'se' | 'ne' | 'nw' | 'sw',
    newPos: IPoint,
    oldBox: IBoxWithRotation,
  ) {
    // 1. calculate new width and height
    const [cx, cy] = getRectCenterPoint(oldBox);
    const { x: posX, y: poxY } = transformRotate(
      newPos.x,
      newPos.y,
      -(oldBox.rotation || 0),
      cx,
      cy,
    );
    let width = 0;
    let height = 0;
    if (type === 'se') {
      width = posX - oldBox.x;
      height = poxY - oldBox.y;
    } else if (type === 'ne') {
      width = posX - oldBox.x;
      height = oldBox.y + oldBox.height - poxY;
    } else if (type === 'nw') {
      width = oldBox.x + oldBox.width - posX;
      height = oldBox.y + oldBox.height - poxY;
    } else if (type === 'sw') {
      width = oldBox.x + oldBox.width - posX;
      height = poxY - oldBox.y;
    }

    // 2. correct x and y
    let prevOriginX = 0;
    let prevOriginY = 0;
    let originX = 0;
    let originY = 0;
    if (type === 'se') {
      prevOriginX = oldBox.x;
      prevOriginY = oldBox.y;
      originX = oldBox.x;
      originY = oldBox.y;
    } else if (type === 'ne') {
      prevOriginX = oldBox.x;
      prevOriginY = oldBox.y + oldBox.height;
      originX = oldBox.x;
      originY = oldBox.y + height;
    } else if (type === 'nw') {
      prevOriginX = oldBox.x + oldBox.width;
      prevOriginY = oldBox.y + oldBox.height;
      originX = oldBox.x + width;
      originY = oldBox.y + height;
    } else if (type === 'sw') {
      prevOriginX = oldBox.x + oldBox.width;
      prevOriginY = oldBox.y;
      originX = oldBox.x + width;
      originY = oldBox.y;
    }

    const { x: prevRotatedOriginX, y: prevRotatedOriginY } = transformRotate(
      prevOriginX,
      prevOriginY,
      oldBox.rotation || 0,
      cx,
      cy,
    );
    const { x: rotatedOriginX, y: rotatedOriginY } = transformRotate(
      originX,
      originY,
      oldBox.rotation || 0,
      oldBox.x + width / 2,
      oldBox.y + height / 2,
    );
    const dx = rotatedOriginX - prevRotatedOriginX;
    const dy = rotatedOriginY - prevRotatedOriginY;
    const x = oldBox.x - dx;
    const y = oldBox.y - dy;

    this.setAttrs(
      normalizeRect({
        x,
        y,
        width,
        height,
      }),
    );
  }
  renderFillAndStrokeTexture(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: CanvasRenderingContext2D,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    imgManager: ImgManager,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    smooth: boolean,
  ) {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  strokeTexture(ctx: CanvasRenderingContext2D) {
    throw new Error('Method not implemented.');
  }
  /**
   * fill image
   *
   * reference: https://mp.weixin.qq.com/s/TSpZv_0VJtxPTCCzEqDl8Q
   */
  protected fillImage(
    ctx: CanvasRenderingContext2D,
    texture: TextureImage,
    imgManager: ImgManager,
    smooth: boolean,
  ) {
    const src = texture.attrs.src;
    const width = this.width;
    const height = this.height;
    let img: CanvasImageSource | undefined = undefined;

    // anti-aliasing
    ctx.imageSmoothingEnabled = smooth;

    if (src) {
      imgManager.addImg(src);
      img = imgManager.getImg(src);
    } else {
      ctx.imageSmoothingEnabled = false;
      img = DEFAULT_IMAGE;
    }

    if (!img) {
      return;
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
