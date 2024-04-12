import {
  calcCoverScale,
  cloneDeep,
  genId,
  objectNameGenerator,
  omit,
} from '@suika/common';
import {
  getTransformAngle,
  getTransformedSize,
  identityMatrix,
  type IMatrixArr,
  type IRect,
  isPointInRect,
  isRectContain,
  isRectIntersect,
  type ITransformRect,
  rectToVertices,
  resizeLine,
  resizeRect,
} from '@suika/geo';
import { Matrix } from 'pixi.js';

import { HALF_PI } from '../../constant';
import { type ControlHandle } from '../../control_handle_manager';
import { type ImgManager } from '../../Img_manager';
import { DEFAULT_IMAGE, type PaintImage } from '../../paint';
import {
  GraphType,
  type IBox,
  type IBox2,
  type IBox2WithRotation,
  type IObject,
  type IPoint,
  type Optional,
} from '../../type';
import { drawRoundRectPath } from '../../utils';
import { type GraphAttrs, type IGraphOpts } from './graph_attrs';

export class Graph<ATTRS extends GraphAttrs = GraphAttrs> {
  type = GraphType.Graph;
  attrs: ATTRS;
  protected _cacheBbox: Readonly<IBox> | null = null;

  constructor(
    attrs: Omit<Optional<ATTRS, 'transform'>, 'id'>,
    opts?: IGraphOpts,
  ) {
    const transform = attrs.transform ?? identityMatrix();

    if (opts && !attrs.transform) {
      if (opts.x !== undefined) {
        transform[4] = opts.x;
      }
      if (opts.y !== undefined) {
        transform[5] = opts.y;
      }
    }

    this.attrs = { ...attrs } as ATTRS;
    this.attrs.id ??= genId();
    this.attrs.transform = transform;

    if (this.attrs.objectName) {
      objectNameGenerator.setMaxIdx(attrs.objectName);
    } else {
      this.attrs.objectName = objectNameGenerator.gen(this.attrs.type ?? '');
    }
  }

  getAttrs(): ATTRS {
    return cloneDeep(this.attrs);
  }

  protected shouldUpdateBbox(attrs: Partial<GraphAttrs> & IGraphOpts) {
    // TODO: if x, y, width, height value no change, bbox should not be updated
    return (
      attrs.x !== undefined ||
      attrs.y !== undefined ||
      attrs.width !== undefined ||
      attrs.height !== undefined ||
      attrs.transform !== undefined
    );
  }
  updateAttrs(partialAttrs: Partial<GraphAttrs> & IGraphOpts) {
    // TODO: 提示，x、y、rotation 不能和 transform 同时存在，否则效果不可预测
    // 目前是后者会覆盖前者
    if (this.shouldUpdateBbox(partialAttrs)) {
      this._cacheBbox = null;
    }
    if (!partialAttrs.transform) {
      if (partialAttrs.x !== undefined) {
        this.attrs.transform[4] = partialAttrs.x;
      }
      if (partialAttrs.y !== undefined) {
        this.attrs.transform[5] = partialAttrs.y;
      }
    }

    if (partialAttrs.rotate !== undefined) {
      this.setRotate(partialAttrs.rotate);
    }
    partialAttrs = omit(partialAttrs, 'x', 'y', 'rotate');
    for (const key in partialAttrs) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-explicit-any
      (this.attrs as any)[key] = partialAttrs[key as keyof typeof partialAttrs];
    }
  }

  getStrokeWidth() {
    return this.attrs.strokeWidth ?? 0;
  }

  /**
   * AABB (axis-aligned bounding box), without considering strokeWidth)
   * Consider rotation (orthogonal bounding box after rotation)
   */
  getBbox(opt?: { includeStroke?: boolean }): Readonly<IBox> {
    if (this._cacheBbox) {
      return this._cacheBbox;
    }

    let width = this.attrs.width;
    let height = this.attrs.height;
    if (opt?.includeStroke) {
      const strokeWidth = this.getStrokeWidth() / 2;
      width += strokeWidth;
      height += strokeWidth;
    }

    const tf = new Matrix(...this.attrs.transform);
    const vertices = rectToVertices({
      x: 0,
      y: 0,
      width,
      height,
    }).map((item) => {
      const pos = tf.apply(item);
      return { x: pos.x, y: pos.y };
    });

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const vertex of vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }

    this._cacheBbox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
    return { ...this._cacheBbox };
  }
  /**
   * other getBbox with
   * minX, minY, maxX, maxY style
   */
  getBbox2(): Readonly<IBox2> {
    const bbox = this.getBbox();
    return {
      minX: bbox.x,
      minY: bbox.y,
      maxX: bbox.x + bbox.width,
      maxY: bbox.y + bbox.height,
    };
  }
  getBboxVerts(): IPoint[] {
    const rect = {
      x: 0,
      y: 0,
      width: this.attrs.width,
      height: this.attrs.height,
    };
    return rectToVertices(rect, this.attrs.transform);
  }

  getPosition() {
    return { x: this.attrs.transform[4], y: this.attrs.transform[5] };
  }

  getX() {
    return this.attrs.transform[4];
  }

  getY() {
    return this.attrs.transform[5];
  }

  getSize() {
    return { width: this.attrs.width, height: this.attrs.height };
  }

  getRect() {
    return {
      ...this.getPosition(),
      width: this.attrs.width,
      height: this.attrs.height,
    };
  }

  getTransformSize() {
    return getTransformedSize(this.attrs);
  }

  getCenter(): IPoint {
    const tf = new Matrix(...this.attrs.transform);
    const center = tf.apply({
      x: this.attrs.width / 2,
      y: this.attrs.height / 2,
    });
    return { x: center.x, y: center.y };
  }

  hitTest(x: number, y: number, padding = 0) {
    return isPointInRect(
      { x, y },
      {
        ...this.getSize(),
        transform: this.attrs.transform,
      },
      padding + this.getStrokeWidth() / 2,
    );
  }

  /**
   * whether the element intersect with the rect
   */
  intersectWithRect(rect: IRect) {
    let isIntersected = false;
    if (!isRectIntersect(rect, this.getBbox())) {
      isIntersected = false;
    } else {
      const rotate = this.getRotate();
      if (!rotate || rotate % HALF_PI == 0) {
        isIntersected = true;
      } else {
        // OBB intersect
        // use SAT algorithm to check intersect
        const tf = new Matrix(...this.attrs.transform).invert();
        const [s1, s2, s3, s4] = rectToVertices(rect, [
          tf.a,
          tf.b,
          tf.c,
          tf.d,
          tf.tx,
          tf.ty,
        ]);

        const minX = Math.min(s1.x, s2.x, s3.x, s4.x);
        const minY = Math.min(s1.y, s2.y, s3.y, s4.y);
        const maxX = Math.max(s1.x, s2.x, s3.x, s4.x);
        const maxY = Math.max(s1.y, s2.y, s3.y, s4.y);

        const rotatedSelection = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };

        isIntersected = isRectIntersect(rotatedSelection, {
          x: 0,
          y: 0,
          ...this.getSize(),
        });
      }
    }

    return isIntersected;
  }

  /**
   * whether the element contain with the rect
   */
  containWithRect(rect: IRect) {
    const bbox = this.getBbox();
    return isRectContain(rect, bbox) || isRectContain(bbox, rect);
  }

  updateByControlHandle(
    /** 'se' | 'ne' | 'nw' | 'sw' | 'n' | 'e' | 's' | 'w' */
    type: string,
    newPos: IPoint,
    oldBox: ITransformRect,
    isShiftPressing = false,
    isAltPressing = false,
  ) {
    // TODO: FIXME: refactor getResizedLine
    // const rect =
    //   this.attrs.height === 0
    //     ? getResizedLine(type, newPos, oldBox, isShiftPressing, isAltPressing)
    //     : getResizedRect(type, newPos, oldBox, isShiftPressing, isAltPressing);
    const rect =
      this.attrs.height === 0
        ? resizeLine(type, newPos, oldBox, {
            keepPolarSnap: isShiftPressing,
            scaleFromCenter: isAltPressing,
          })
        : resizeRect(type, newPos, oldBox, {
            keepRatio: isShiftPressing,
            scaleFromCenter: isAltPressing,
          });

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
    const { width, height, transform } = this.attrs;
    ctx.transform(...transform);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.stroke();
    ctx.closePath();
  }

  /**
   * fill image
   *
   * reference: https://mp.weixin.qq.com/s/TSpZv_0VJtxPTCCzEqDl8Q
   */
  protected fillImage(
    ctx: CanvasRenderingContext2D,
    paint: PaintImage,
    imgManager: ImgManager,
    smooth = true,
    cornerRadius = 0,
  ) {
    const src = paint.attrs.src;
    const width = this.attrs.width;
    const height = this.attrs.height;
    const x = 0;
    const y = 0;
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
      const transform = graph.attrs.transform;
      transform[4] += dx;
      transform[5] += dy;
      graph.updateAttrs({
        transform,
      });
    }
  }

  toJSON(): GraphAttrs {
    return { ...this.attrs };
  }

  getVisible() {
    return this.attrs.visible ?? true;
  }

  getLock() {
    return this.attrs.lock ?? false;
  }

  /**
   * get simple info (for layer panel)
   */
  toObject(): IObject {
    return {
      type: this.type,
      id: this.attrs.id,
      name: this.attrs.objectName,
      visible: this.getVisible(),
      lock: this.getLock(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getControlHandles(_zoom: number, _initial?: boolean): ControlHandle[] {
    return [];
  }

  getRotate() {
    return getTransformAngle(this.attrs.transform);
  }
  setRotate(newRotate: number, center?: IPoint) {
    const rotate = this.getRotate();
    const delta = newRotate - rotate;
    center ??= this.getCenter();
    const rotateMatrix = new Matrix()
      .translate(-center.x, -center.y)
      .rotate(delta)
      .translate(center.x, center.y);
    const tf = new Matrix(...this.attrs.transform);
    const newTf = rotateMatrix.append(tf);
    this.updateAttrs({
      transform: [newTf.a, newTf.b, newTf.c, newTf.d, newTf.tx, newTf.ty],
    });
  }

  dRotate(
    dRotation: number,
    initAttrs: IBox2WithRotation & { transform: IMatrixArr },
    center: IPoint,
  ) {
    const rotateMatrix = new Matrix()
      .translate(-center.x, -center.y)
      .rotate(dRotation)
      .translate(center.x, center.y);
    const tf = new Matrix(...initAttrs.transform);
    const newTf = rotateMatrix.append(tf);
    this.updateAttrs({
      transform: [newTf.a, newTf.b, newTf.c, newTf.d, newTf.tx, newTf.ty],
    });
  }
}
