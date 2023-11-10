import { IBox, IBox2, GraphType, IPoint, IBox2WithRotation } from '../../type';
import { IRect } from '@suika/geo';
import { calcCoverScale, genId, objectNameGenerator } from '../../utils/common';
import { IRectWithRotation, isPointInRect, isRectIntersect } from '@suika/geo';
import {
  getAbsoluteCoords,
  getElementRotatedXY,
  getRectCenterPoint,
} from '../../utils/graphics';
import { normalizeRect, normalizeRadian, isRectContain } from '@suika/geo';
import { transformRotate } from '@suika/geo';
import { DEFAULT_IMAGE, ITexture, TextureImage } from '../texture';
import { ImgManager } from '../Img_manager';
import { HALF_PI } from '../../constant';
import { rotateInCanvas } from '../../utils/canvas';

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
  visible?: boolean;
  lock?: boolean;
}

export class Graph {
  type = GraphType.Graph;
  id: string;
  objectName: string;
  protected _x: number;
  protected _y: number;
  width: number;
  height: number;
  // color
  fill: ITexture[] = [];
  stroke: ITexture[] = [];
  strokeWidth?: number;
  // transform
  rotation?: number;
  visible?: boolean;
  lock?: boolean;

  get x() {
    return this._x;
  }
  set x(val: number) {
    this._x = val;
  }
  get y() {
    return this._y;
  }
  set y(val: number) {
    this._y = val;
  }

  constructor(options: GraphAttrs) {
    this.type = options.type ?? this.type;
    this.id = options.id ?? genId();

    if (options.objectName) {
      this.objectName = options.objectName;
      objectNameGenerator.setMaxIdx(options.objectName);
    } else {
      this.objectName = objectNameGenerator.gen(options.type ?? this.type);
    }

    this._x = options.x;
    this._y = options.y;
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
    if (options.visible !== undefined) {
      this.visible = options.visible;
    }
    if (options.lock !== undefined) {
      this.lock = options.lock;
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
      visible: this.visible,
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

  getRectWithRotation(): IRectWithRotation {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
    };
  }

  /**
   * 计算包围盒（不考虑 strokeWidth）
   * 考虑旋转 (旋转后的正交包围盒)
   */
  getBBox(): IBox {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);
    const rotation = this.rotation;
    if (!rotation) {
      return this.getRect();
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
      const box = this.getRect();
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

  /**
   * get bbox before rotation
   */
  getRect() {
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
    const bBox = this.getRect();
    const [cx, cy] = getRectCenterPoint(bBox);
    const rotatedHitPoint = this.rotation
      ? transformRotate(x, y, -this.rotation, cx, cy)
      : { x, y };

    const strokeWidth = (this.strokeWidth ?? 0) / 2;
    return isPointInRect(rotatedHitPoint, bBox, padding + strokeWidth);
  }

  /**
   * whether the element intersect with the rect
   */
  intersectWithRect(rect: IRect) {
    let isIntersected = false;
    if (!isRectIntersect(rect, this.getBBox())) {
      isIntersected = false;
    } else {
      if (!this.rotation || this.rotation % HALF_PI == 0) {
        isIntersected = true;
      } else {
        // OBB intersect
        // use SAT algorithm to check intersect
        const { x: cx, y: cy } = this.getCenter();
        const r = -this.rotation;
        const s1 = transformRotate(rect.x, rect.y, r, cx, cy);
        const s2 = transformRotate(
          rect.x + rect.width,
          rect.y + rect.height,
          r,
          cx,
          cy,
        );
        const s3 = transformRotate(rect.x + rect.width, rect.y, r, cx, cy);
        const s4 = transformRotate(rect.x, rect.y + rect.height, r, cx, cy);

        const rotatedSelectionX = Math.min(s1.x, s2.x, s3.x, s4.x);
        const rotatedSelectionY = Math.min(s1.y, s2.y, s3.y, s4.y);
        const rotatedSelectionWidth =
          Math.max(s1.x, s2.x, s3.x, s4.x) - rotatedSelectionX;
        const rotatedSelectionHeight =
          Math.max(s1.y, s2.y, s3.y, s4.y) - rotatedSelectionY;

        const rotatedSelection = {
          x: rotatedSelectionX,
          y: rotatedSelectionY,
          width: rotatedSelectionWidth,
          height: rotatedSelectionHeight,
        };

        isIntersected = isRectIntersect(rotatedSelection, {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height,
        });
      }
    }

    return isIntersected;
  }

  /**
   * whether the element contain with the rect
   */
  containWithRect(rect: IRect) {
    const bbox = this.getBBox();
    return isRectContain(rect, bbox) || isRectContain(bbox, rect);
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
    type: string, // 'se' | 'ne' | 'nw' | 'sw' | 'n' | 'e' | 's' | 'w',
    newPos: IPoint,
    oldBox: IBox2WithRotation,
    keepRatio = false,
    scaleFromCenter = false,
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

    const x2 = oldBox.x + oldBox.width;
    const y2 = oldBox.y + oldBox.height;

    let width = 0;
    let height = 0;

    switch (type) {
      case 'se':
        if (scaleFromCenter) {
          width = (posX - cx) * 2;
          height = (poxY - cy) * 2;
        } else {
          width = posX - oldBox.x;
          height = poxY - oldBox.y;
        }
        break;
      case 'ne':
        if (scaleFromCenter) {
          width = (posX - cx) * 2;
          height = (cy - poxY) * 2;
        } else {
          width = posX - oldBox.x;
          height = y2 - poxY;
        }
        break;
      case 'nw':
        if (scaleFromCenter) {
          width = (cx - posX) * 2;
          height = (cy - poxY) * 2;
        } else {
          width = x2 - posX;
          height = y2 - poxY;
        }
        break;
      case 'sw':
        if (scaleFromCenter) {
          width = (cx - posX) * 2;
          height = (poxY - cy) * 2;
        } else {
          width = x2 - posX;
          height = poxY - oldBox.y;
        }
        break;
      case 'n':
        if (scaleFromCenter) {
          width = oldBox.width;
          height = (cy - poxY) * 2;
        } else {
          width = oldBox.width;
          height = y2 - poxY;
        }
        break;
      case 'e':
        if (scaleFromCenter) {
          width = (posX - cx) * 2;
          height = oldBox.height;
        } else {
          width = posX - oldBox.x;
          height = oldBox.height;
        }
        break;
      case 's':
        if (scaleFromCenter) {
          width = oldBox.width;
          height = (poxY - cy) * 2;
        } else {
          width = oldBox.width;
          height = poxY - oldBox.y;
        }
        break;
      case 'w':
        if (scaleFromCenter) {
          width = (cx - posX) * 2;
          height = oldBox.height;
        } else {
          width = x2 - posX;
          height = oldBox.height;
        }
        break;

      default:
        throw new Error(`movePoint type ${type} is invalid`);
    }

    if (keepRatio) {
      const ratio = oldBox.width / oldBox.height;
      const newRatio = Math.abs(width / height);
      if (
        (['nw', 'ne', 'se', 'sw'].includes(type) && newRatio > ratio) ||
        type === 'e' ||
        type === 'w'
      ) {
        height = (Math.sign(height) * Math.abs(width)) / ratio;
      } else {
        width = Math.sign(width) * Math.abs(height) * ratio;
      }
    }

    // 2. correct x and y
    let prevOriginX = 0;
    let prevOriginY = 0;
    let originX = 0;
    let originY = 0;
    if (scaleFromCenter) {
      prevOriginX = cx;
      prevOriginY = cy;
      originX = oldBox.x + width / 2;
      originY = oldBox.y + height / 2;
    } else {
      switch (type) {
        case 'se':
          prevOriginX = oldBox.x; // origin point is left-top
          prevOriginY = oldBox.y;
          originX = oldBox.x;
          originY = oldBox.y;
          break;
        case 'ne':
          prevOriginX = oldBox.x; // left-bottom
          prevOriginY = y2;
          originX = oldBox.x;
          originY = oldBox.y + height;
          break;
        case 'nw':
          prevOriginX = x2; // right-bottom
          prevOriginY = y2;
          originX = oldBox.x + width;
          originY = oldBox.y + height;
          break;
        case 'sw':
          prevOriginX = x2; // right-top
          prevOriginY = oldBox.y;
          originX = oldBox.x + width;
          originY = oldBox.y;
          break;
        case 'n':
          prevOriginX = oldBox.x + oldBox.width / 2; // center-bottom
          prevOriginY = y2;
          originX = oldBox.x + width / 2;
          originY = oldBox.y + height;
          break;
        case 'e':
          prevOriginX = oldBox.x; // left-center
          prevOriginY = oldBox.y + oldBox.height / 2;
          originX = oldBox.x;
          originY = oldBox.y + height / 2;
          break;
        case 's':
          prevOriginX = oldBox.x + oldBox.width / 2; // center-top
          prevOriginY = oldBox.y;
          originX = oldBox.x + width / 2;
          originY = oldBox.y;
          break;
        case 'w':
          prevOriginX = x2; // right-center
          prevOriginY = oldBox.y + oldBox.height / 2;
          originX = oldBox.x + width;
          originY = oldBox.y + height / 2;
          break;
      }
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
  draw(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: CanvasRenderingContext2D,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    imgManager?: ImgManager,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    smooth?: boolean,
  ) {
    throw new Error('draw Method not implemented.');
  }

  drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    if (this.rotation) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;

      rotateInCanvas(ctx, this.rotation, cx, cy);
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.stroke();
    ctx.closePath();
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
    smooth = true,
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

  toJSON() {
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
      visible: this.visible,
      lock: this.lock,
    };
  }

  getVisible() {
    return this.visible ?? true;
  }

  getLock() {
    return this.lock ?? false;
  }

  /**
   * get simple info (for layer panel)
   */
  toObject() {
    return {
      type: this.type,
      id: this.id,
      name: this.objectName,
      visible: this.getVisible(),
      lock: this.getLock(),
    };
  }

  /**
   * add dRotate to rotation
   */
  dRotate(dRotation: number, initAttrs: IBox2WithRotation, center: IPoint) {
    this.rotation = normalizeRadian(initAttrs.rotation + dRotation);

    const [graphCx, graphCy] = getRectCenterPoint(initAttrs);

    const { x, y } = transformRotate(
      graphCx,
      graphCy,
      dRotation,
      center.x,
      center.y,
    );

    this.x = x - initAttrs.width / 2;
    this.y = y - initAttrs.height / 2;
  }
}
