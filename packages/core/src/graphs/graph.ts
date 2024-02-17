import { calcCoverScale, genId, objectNameGenerator } from '@suika/common';
import {
  getRectRotatedXY,
  getResizedRect,
  IRect,
  IRectWithRotation,
  isPointInRect,
  isRectContain,
  isRectIntersect,
  normalizeRadian,
  transformRotate,
} from '@suika/geo';

import { HALF_PI } from '../constant';
import { ControlHandle } from '../control_handle_manager';
import { ImgManager } from '../Img_manager';
import { getResizedLine } from '../scene/utils';
import { DEFAULT_IMAGE, ITexture, TextureImage } from '../texture';
import { GraphType, IBox, IBox2, IBox2WithRotation, IPoint } from '../type';
import {
  drawRoundRectPath,
  getAbsoluteCoords,
  getRectCenterPoint,
  rotateInCanvas,
} from '../utils';

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
  cornerRadius?: number;
  visible?: boolean;
  lock?: boolean;
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
  cornerRadius?: number;
  visible?: boolean;
  lock?: boolean;
  private _cacheBbox: Readonly<IBox> | null = null;

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
  private shouldUpdateBbox(attrs: Partial<GraphAttrs>) {
    // TODO: if x, y, width, height value no change, bbox should not be updated
    return (
      attrs.x !== undefined ||
      attrs.y !== undefined ||
      attrs.width !== undefined ||
      attrs.height !== undefined
    );
  }
  updateAttrs(attrs: Partial<GraphAttrs>) {
    let key: keyof Partial<GraphAttrs>;
    if (this.shouldUpdateBbox(attrs)) {
      this._cacheBbox = null;
    }
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
   * AABB (axis-aligned bounding box), without considering strokeWidth)
   * Consider rotation (orthogonal bounding box after rotation)
   */
  getBBox(): Readonly<IBox> {
    if (this._cacheBbox) {
      return this._cacheBbox;
    }

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
    this._cacheBbox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
    return this._cacheBbox;
  }
  /**
   * other getBBox with
   * minX, minY, maxX, maxY style
   */
  getBBox2(): Readonly<IBox2> {
    const bbox = this.getBBox();
    return {
      minX: bbox.x,
      minY: bbox.y,
      maxX: bbox.x + bbox.width,
      maxY: bbox.y + bbox.height,
    };
  }
  getBboxVerts(): [IPoint, IPoint, IPoint, IPoint] {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this.getRect());

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
   * get rect before rotation
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
    const rect = this.getRect();
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
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
    this.updateAttrs({ x, y });
  }
  hitTest(x: number, y: number, padding = 0) {
    const strokeWidth = (this.strokeWidth ?? 0) / 2;
    return isPointInRect(
      { x, y },
      this.getRectWithRotation(),
      padding + strokeWidth,
    );
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
        const bbox = this.getRectWithRotation();
        const [cx, cy] = getRectCenterPoint(bbox);
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

        isIntersected = isRectIntersect(rotatedSelection, bbox);
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
    const { x: prevRotatedX } = getRectRotatedXY(this);
    this.updateAttrs({ x: this.x + rotatedX - prevRotatedX });
  }
  setRotatedY(rotatedY: number) {
    const { y: prevRotatedY } = getRectRotatedXY(this);
    this.updateAttrs({ y: this.y + rotatedY - prevRotatedY });
  }

  updateByControlHandle(
    type: string, // 'se' | 'ne' | 'nw' | 'sw' | 'n' | 'e' | 's' | 'w',
    newPos: IPoint,
    oldBox: IBox2WithRotation,
    isShiftPressing = false,
    isAltPressing = false,
  ) {
    const rect =
      this.height === 0
        ? getResizedLine(type, newPos, oldBox, isShiftPressing, isAltPressing)
        : getResizedRect(type, newPos, oldBox, isShiftPressing, isAltPressing);
    this.updateAttrs(rect);
  }
  draw(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx: CanvasRenderingContext2D,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _imgManager?: ImgManager,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _smooth?: boolean,
  ) {
    throw new Error('draw Method not implemented.');
  }

  drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    const { x, y, width, height } = this.getRect();
    if (this.rotation) {
      const cx = x + width / 2;
      const cy = y + height / 2;
      rotateInCanvas(ctx, this.rotation, cx, cy);
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    ctx.closePath();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  strokeTexture(_ctx: CanvasRenderingContext2D) {
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
    cornerRadius = 0,
  ) {
    const src = texture.attrs.src;
    const { x, y, width, height } = this.getRect();
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

    if (cornerRadius) {
      ctx.save();
      drawRoundRectPath(ctx, x, y, width, height, cornerRadius);
      ctx.clip();
    }

    ctx.drawImage(
      img,
      sx,
      sy,
      width / scale,
      height / scale,
      x,
      y,
      width,
      height,
    );

    if (cornerRadius) {
      ctx.restore();
    }
  }

  static dMove(graphs: Graph[], dx: number, dy: number) {
    for (const graph of graphs) {
      graph.x += dx;
      graph.y += dy;
    }
  }

  toJSON(): GraphAttrs {
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
    this.rotation = normalizeRadian((initAttrs.rotation ?? 0) + dRotation);

    const [graphCx, graphCy] = getRectCenterPoint(initAttrs);

    const { x, y } = transformRotate(
      graphCx,
      graphCy,
      dRotation,
      center.x,
      center.y,
    );

    this.updateAttrs({
      x: x - initAttrs.width / 2,
      y: y - initAttrs.height / 2,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getControlHandles(_zoom: number, _initial?: boolean): ControlHandle[] {
    return [];
  }
}
