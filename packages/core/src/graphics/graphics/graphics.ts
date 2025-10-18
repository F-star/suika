import {
  calcCoverScale,
  cloneDeep,
  genUuid,
  isEqual,
  objectNameGenerator,
  omit,
  parseRGBToHex,
  pick,
} from '@suika/common';
import {
  boxToRect,
  calcRectBbox,
  getTransformAngle,
  getTransformedSize,
  type IBox,
  identityMatrix,
  type IMatrixArr,
  invertMatrix,
  type IPoint,
  isBoxContain,
  isBoxIntersect,
  isPointInTransformedRect,
  isRectIntersect,
  type ITransformRect,
  Matrix,
  multiplyMatrix,
  normalizeRadian,
  rad2Deg,
  recomputeTransformRect,
  rectToVertices,
  resizeLine,
  resizeRect,
} from '@suika/geo';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

import { HALF_PI } from '../../constant';
import { type ControlHandle } from '../../control_handle_manager';
import { type ImgManager } from '../../Img_manager';
import {
  DEFAULT_IMAGE,
  isPaintsShouldRender,
  type PaintImage,
  PaintType,
} from '../../paint';
import {
  GraphicsType,
  type IFillStrokeSVGAttrs,
  type IObject,
  type Optional,
} from '../../type';
import { drawRoundRectPath } from '../../utils';
import { type SuikaDocument } from '../document';
import { type IDrawInfo, type IHitOptions } from '../type';
import {
  type GraphicsAttrs,
  type IAdvancedAttrs,
  type IGraphicsOpts,
} from './graphics_attrs';

export class SuikaGraphics<ATTRS extends GraphicsAttrs = GraphicsAttrs> {
  type = GraphicsType.Graph;
  attrs: ATTRS;
  protected doc: SuikaDocument;
  protected _cacheBboxWithStroke: Readonly<IBox> | null = null;
  protected _cacheBbox: Readonly<IBox> | null = null;
  protected _cacheMinBbox: IBox | null = null;

  /** hide graphics temporarily, it's possible that attrs.visible is true */
  noRender = false;
  private _deleted = false;
  private _sortDirty = false;

  private noCollectUpdate: boolean;

  constructor(
    attrs: Omit<Optional<ATTRS, 'transform'>, 'id'>,
    opts: IGraphicsOpts,
  ) {
    this.doc = opts.doc;
    const transform = attrs.transform ?? identityMatrix();

    const advancedAttrs = opts.advancedAttrs;
    if (advancedAttrs && !attrs.transform) {
      if (advancedAttrs.x !== undefined) {
        transform[4] = advancedAttrs.x;
      }
      if (advancedAttrs.y !== undefined) {
        transform[5] = advancedAttrs.y;
      }
    }

    this.attrs = { ...attrs } as ATTRS;
    this.attrs.id ??= genUuid();
    this.attrs.transform = transform;
    this.attrs.strokeWidth ??= 1;

    if (this.attrs.objectName) {
      objectNameGenerator.setMaxIdx(attrs.objectName);
    } else {
      this.attrs.objectName = objectNameGenerator.gen(this.attrs.type ?? '');
    }

    this.noCollectUpdate = Boolean(opts?.noCollectUpdate);
  }

  getAttrs(): ATTRS {
    return cloneDeep(this.attrs);
  }

  protected shouldUpdateBbox(attrs: Partial<GraphicsAttrs> & IAdvancedAttrs) {
    // TODO: if x, y, width, height value no change, bbox should not be updated
    return (
      attrs.x !== undefined ||
      attrs.y !== undefined ||
      attrs.width !== undefined ||
      attrs.height !== undefined ||
      attrs.transform !== undefined ||
      'strokeWidth' in attrs ||
      'parentIndex' in attrs
    );
  }

  protected clearBboxCache() {
    this._cacheBbox = null;
    this._cacheBboxWithStroke = null;
    this._cacheMinBbox = null;
  }

  private updatedKeys = new Set<string>();

  getUpdatedAttrs() {
    const attrs = pick(this.attrs, [...this.updatedKeys]);
    this.updatedKeys.clear();
    return attrs;
  }

  updateAttrs(
    partialAttrs: Partial<GraphicsAttrs> & IAdvancedAttrs,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: { finishRecomputed?: boolean },
  ) {
    // TODO: 提示，x、y、rotation 不能和 transform 同时存在，否则效果不可预测
    // 目前是后者会覆盖前者
    if (this.shouldUpdateBbox(partialAttrs)) {
      this.clearBboxCache();
    }

    if (
      'strokeWidth' in partialAttrs &&
      partialAttrs.strokeWidth === undefined
    ) {
      partialAttrs.strokeWidth = 1;
    }

    if (!partialAttrs.transform) {
      if (partialAttrs.x !== undefined || partialAttrs.y !== undefined) {
        const tf = cloneDeep(this.attrs.transform);
        if (partialAttrs.x) {
          tf[4] = partialAttrs.x;
        }
        if (partialAttrs.y) {
          tf[5] = partialAttrs.y;
        }
        this.attrs.transform = tf;
        this.updatedKeys.add('transform');
      }
    }

    if (partialAttrs.rotate !== undefined) {
      this.setRotate(partialAttrs.rotate);
    }
    partialAttrs = omit(partialAttrs, 'x', 'y', 'rotate');
    for (const key in partialAttrs) {
      this.updatedKeys.add(key);
      // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-explicit-any
      (this.attrs as any)[key] = partialAttrs[key as keyof typeof partialAttrs];
    }

    if (!this.noCollectUpdate || this.attrs.parentIndex) {
      this.doc.collectUpdatedGraphics(this.attrs.id);
    }
  }

  cancelCollectUpdate() {
    this.noCollectUpdate = true;
  }

  /** render stroke width */
  protected getStrokeWidth() {
    if (!this.attrs.stroke?.length) {
      return 0;
    }
    return this.attrs.strokeWidth ?? 0;
  }
  getBboxWithStroke() {
    if (this._cacheBboxWithStroke) {
      return this._cacheBboxWithStroke;
    }
    const bbox = calcRectBbox(
      {
        ...this.getSize(),
        transform: this.getWorldTransform(),
      },
      this.getStrokeWidth() / 2,
    );
    this._cacheBboxWithStroke = bbox;
    return bbox;
  }

  getBbox(): Readonly<IBox> {
    return calcRectBbox({
      ...this.getSize(),
      transform: this.getWorldTransform(),
    });
  }

  getLocalBbox(): Readonly<IBox> {
    if (this._cacheBbox) {
      return this._cacheBbox;
    }
    const bbox = calcRectBbox({
      ...this.getSize(),
      transform: this.attrs.transform,
    });
    this._cacheBbox = bbox;
    return bbox;
  }

  getMinBbox(): Readonly<IBox> {
    return this.getBbox();
  }

  getWorldBboxVerts(): IPoint[] {
    const rect = {
      x: 0,
      y: 0,
      width: this.attrs.width,
      height: this.attrs.height,
    };
    return rectToVertices(rect, this.getWorldTransform());
  }

  getLocalPosition() {
    return { x: this.attrs.transform[4], y: this.attrs.transform[5] };
  }

  getWorldPosition() {
    const tf = this.getWorldTransform();
    return { x: tf[4], y: tf[5] };
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

  getOpacity() {
    return this.attrs.opacity ?? 1;
  }

  getRect() {
    return {
      ...this.getLocalPosition(),
      width: this.attrs.width,
      height: this.attrs.height,
    };
  }

  getTransformedSize() {
    return getTransformedSize(this.attrs);
  }

  getLocalCenter(): IPoint {
    const tf = new Matrix(...this.attrs.transform);
    return tf.apply({
      x: this.attrs.width / 2,
      y: this.attrs.height / 2,
    });
  }

  getWorldCenter(): IPoint {
    const tf = new Matrix(...this.getWorldTransform());
    return tf.apply({
      x: this.attrs.width / 2,
      y: this.attrs.height / 2,
    });
  }

  protected isStrokeShouldRender() {
    return isPaintsShouldRender(this.attrs.stroke);
  }

  protected isFillShouldRender() {
    return isPaintsShouldRender(this.attrs.fill);
  }

  hitTest(point: IPoint, tol = 0) {
    return isPointInTransformedRect(
      point,
      {
        ...this.getSize(),
        transform: this.getWorldTransform(),
      },
      tol + this.getStrokeWidth() / 2,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getHitGraphics(point: IPoint, options: IHitOptions): SuikaGraphics | null {
    const { tol = 0 } = options;
    if (
      !this.isVisible() ||
      this.isLock() ||
      (!this.isFillShouldRender() && !this.isStrokeShouldRender())
    ) {
      return null;
    }
    if (this.hitTest(point, tol)) {
      return this;
    }
    return null;
  }

  hitTestChildren(point: IPoint, padding = 0): boolean {
    if (!this.isContainer) {
      return this.hitTest(point, padding);
    }

    if (!this.hitTest(point, padding)) {
      return false;
    }
    const children = this.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      if (children[i].hitTest(point, padding)) {
        return true;
      }
    }
    return false;
  }

  intersectWithChildrenBox(box: IBox) {
    if (!this.isContainer) {
      return this.intersectWithBox(box);
    }
    if (!this.intersectWithBox(box)) {
      return false;
    }
    const children = this.getChildren();
    for (const child of children) {
      if (child.isVisible() && child.intersectWithBox(box)) {
        return true;
      }
    }
    return false;
  }

  protected strokeAABBIntersectWithBox(box: IBox) {
    return isBoxIntersect(box, this.getBboxWithStroke());
  }

  /**
   * whether the element intersect with the box
   */
  intersectWithBox(box: IBox) {
    let isIntersected = false;
    if (!isBoxIntersect(box, this.getMinBbox())) {
      isIntersected = false;
    } else {
      const rotate = this.getRotate();
      if (!rotate || rotate % HALF_PI == 0) {
        isIntersected = true;
      } else {
        // OBB intersect
        // use SAT algorithm to check intersect
        const [s1, s2, s3, s4] = rectToVertices(
          boxToRect(box),
          invertMatrix(this.getWorldTransform()),
        );

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
  containWithBox(box: IBox) {
    const bbox = this.getMinBbox();
    return isBoxContain(box, bbox) || isBoxContain(bbox, box);
  }

  /**
   * calculate new attributes by control handle
   */
  calcNewAttrsByControlHandle(
    /** 'se' | 'ne' | 'nw' | 'sw' | 'n' | 'e' | 's' | 'w' */
    type: string,
    newPos: IPoint,
    oldRect: ITransformRect,
    oldWorldTransform: IMatrixArr,
    isShiftPressing = false,
    isAltPressing = false,
    flipWhenResize?: boolean,
  ): Partial<ATTRS> {
    const parentTf = this.getParentWorldTransform();
    oldRect = {
      width: oldRect.width,
      height: oldRect.height,
      transform: oldWorldTransform,
    };
    const rect =
      this.attrs.height === 0
        ? resizeLine(type, newPos, oldRect, {
            keepPolarSnap: isShiftPressing,
            scaleFromCenter: isAltPressing,
          })
        : resizeRect(type, newPos, oldRect, {
            keepRatio: isShiftPressing,
            scaleFromCenter: isAltPressing,
            flip: flipWhenResize,
          });
    rect.transform = multiplyMatrix(invertMatrix(parentTf), rect.transform);
    return rect as Partial<ATTRS>;
  }

  /**
   * update attributes by control handle
   * @param type
   * @param newPos
   * @param oldRect
   * @param isShiftPressing
   * @param isAltPressing
   * @param flipWhenResize
   * @returns if width or height is zero, return true; otherwise return undefined
   */
  updateByControlHandle(
    /** 'se' | 'ne' | 'nw' | 'sw' | 'n' | 'e' | 's' | 'w' */
    type: string,
    newPos: IPoint,
    oldRect: ITransformRect,
    oldWorldTransform: IMatrixArr,
    isShiftPressing = false,
    isAltPressing = false,
    flipWhenResize?: boolean,
  ) {
    const rect = this.calcNewAttrsByControlHandle(
      type,
      newPos,
      oldRect,
      oldWorldTransform,
      isShiftPressing,
      isAltPressing,
      flipWhenResize,
    );

    this.updateAttrs(rect, { finishRecomputed: true });
  }

  protected shouldSkipDraw(drawInfo: IDrawInfo) {
    if (!this.isVisible()) return true;
    const opacity = this.getOpacity() * (drawInfo.opacity ?? 1);
    if (opacity === 0) return true;

    if (
      drawInfo.viewportArea &&
      !this.strokeAABBIntersectWithBox(drawInfo.viewportArea)
    ) {
      return true;
    }
    return false;
  }

  draw(drawInfo: IDrawInfo) {
    if (this.shouldSkipDraw(drawInfo)) return;

    const { ctx } = drawInfo;

    ctx.save();
    ctx.transform(...this.attrs.transform);
    for (const child of this.children) {
      child.draw(drawInfo);
    }
    ctx.restore();
  }

  drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    const { width, height } = this.attrs;
    ctx.transform(...this.getWorldTransform());
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

  static dMove(graphicsArr: SuikaGraphics[], dx: number, dy: number) {
    for (const graphics of graphicsArr) {
      const tf = graphics.getWorldTransform();
      tf[4] += dx;
      tf[5] += dy;
      graphics.setWorldTransform(tf);
    }
  }

  toJSON(): GraphicsAttrs {
    return { ...this.attrs };
  }

  isVisible() {
    return this.attrs.visible ?? true;
  }

  isLock() {
    return this.attrs.lock ?? false;
  }

  isDeleted() {
    return this._deleted;
  }

  setDeleted(val: boolean) {
    this._deleted = val;
    this.doc.collectDeletedGraphics(this);
  }

  /**
   * get simple info (for layer panel)
   */
  toObject(): IObject {
    return {
      type: this.type,
      id: this.attrs.id,
      name: this.attrs.objectName,
      visible: this.isVisible(),
      lock: this.isLock(),
      children: this.children.map((item) => item.toObject()),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getControlHandles(_zoom: number, _initial?: boolean): ControlHandle[] {
    return [];
  }

  getRotate() {
    return getTransformAngle(this.getWorldTransform());
  }

  getRotateDegree() {
    return rad2Deg(normalizeRadian(this.getRotate()));
  }

  setRotate(newRotate: number, center?: IPoint) {
    const rotate = this.getRotate();
    const delta = newRotate - rotate;
    center ??= this.getWorldCenter();
    const rotateMatrix = new Matrix()
      .translate(-center.x, -center.y)
      .rotate(delta)
      .translate(center.x, center.y);
    this.prependWorldTransform(rotateMatrix.getArray());
  }

  prependWorldTransform(m: IMatrixArr) {
    const parentTf = this.getParentWorldTransform();
    const tf = multiplyMatrix(
      m,
      multiplyMatrix(parentTf, this.attrs.transform),
    );
    this.updateAttrs(
      recomputeTransformRect({
        ...this.getSize(),
        transform: multiplyMatrix(invertMatrix(parentTf), tf),
      }),
    );
  }

  dRotate(dRotation: number, originWorldTf: IMatrixArr, center: IPoint) {
    const rotateMatrix = new Matrix()
      .translate(-center.x, -center.y)
      .rotate(dRotation)
      .translate(center.x, center.y);

    const newWoldTf = rotateMatrix
      .append(new Matrix(...originWorldTf))
      .getArray();

    this.setWorldTransform(newWoldTf);
  }

  getInfoPanelAttrs(): {
    label: string;
    key: string;
    value: number | string;
    uiType: string;
    suffixValue?: string;
  }[] {
    const size = this.getTransformedSize();
    const pos = this.getWorldPosition();
    return [
      {
        label: 'X',
        key: 'x',
        value: pos.x,
        uiType: 'number',
      },
      {
        label: 'Y',
        key: 'y',
        value: pos.y,
        uiType: 'number',
      },
      {
        label: 'W',
        key: 'width',
        value: size.width,
        uiType: 'number',
      },
      {
        label: 'H',
        key: 'height',
        value: size.height,
        uiType: 'number',
      },
      {
        label: 'R',
        key: 'rotation',
        value: this.getRotateDegree(),
        suffixValue: '°',
        uiType: 'number',
      },
    ];
  }

  toSVGSegment(offset?: IPoint) {
    const tagHead = this.getSVGTagHead(offset);
    if (!tagHead) {
      console.warn(
        `please implement getSVGTagHead method of "${this.type}" type`,
      );
      return '';
    }

    // TODO: precision config
    const fillAndStrokeAttrs: IFillStrokeSVGAttrs[] = [];

    const { fillPaints, strokePaints } = this.getFillAndStrokesToSVG();
    // TODO: do not to SVG if paints is empty
    if (fillPaints.length <= 1 && strokePaints.length <= 1) {
      const fillPaint = fillPaints[0];
      if (fillPaint) {
        const rect: IFillStrokeSVGAttrs = {};
        if (fillPaint.type === PaintType.Solid) {
          rect.fill = '#' + parseRGBToHex(fillPaint.attrs);
          const opacity = fillPaint.attrs.a;
          if (opacity !== 1) {
            rect['fill-opacity'] = opacity;
          }
        }
        fillAndStrokeAttrs.push(rect);
        // TODO: solve image
      }
      const strokePaint = strokePaints[0];
      if (strokePaint) {
        const rect: IFillStrokeSVGAttrs = {};
        if (strokePaint.type === PaintType.Solid) {
          rect.stroke = '#' + parseRGBToHex(strokePaint.attrs);
          const opacity = strokePaint.attrs.a;
          if (opacity !== 1) {
            rect['stroke-opacity'] = opacity;
          }
        }
        fillAndStrokeAttrs.push(rect);
      }
    } else {
      for (const fillPaint of fillPaints) {
        if (fillPaint) {
          if (fillPaint.type === PaintType.Solid) {
            const rect: IFillStrokeSVGAttrs = {
              fill: '#' + parseRGBToHex(fillPaint.attrs),
            };
            const opacity = fillPaint.attrs.a;
            if (opacity !== 1) {
              rect['fill-opacity'] = opacity;
            }
            fillAndStrokeAttrs.push(rect);
          }
        }
      }
      for (const strokePaint of strokePaints) {
        if (strokePaint) {
          if (strokePaint.type === PaintType.Solid) {
            const rect: IFillStrokeSVGAttrs = {
              stroke: '#' + parseRGBToHex(strokePaint.attrs),
            };
            const opacity = strokePaint.attrs.a;
            if (opacity !== 1) {
              rect['stroke-opacity'] = opacity;
            }
            fillAndStrokeAttrs.push(rect);
          }
        }
      }
    }

    const strokeWidth = this.attrs.strokeWidth ?? 0;
    const strokeWidthStr =
      strokeWidth > 1 ? ` stroke-width="${strokeWidth}"` : '';

    let content = '';
    const tagTail = this.getSVGTagTail();
    for (const attrs of fillAndStrokeAttrs) {
      let fillAndStrokeStr = '';
      let key: keyof typeof attrs;
      for (key in attrs) {
        fillAndStrokeStr += ` ${key}="${attrs[key]}"`;
      }
      content += tagHead + fillAndStrokeStr + strokeWidthStr + tagTail;
    }

    return content;
  }

  protected getSVGTagHead(_offset?: IPoint) {
    return '';
  }

  protected getSVGTagTail() {
    return '/>\n';
  }

  protected getFillAndStrokesToSVG() {
    return {
      fillPaints: this.attrs.fill ?? [],
      strokePaints: this.attrs.stroke ?? [],
    };
  }

  getLayerIconPath() {
    return 'M0.5 0.5H11.5V11.5H0.5V0.5Z';
  }

  getWorldTransform(): IMatrixArr {
    const parent = this.getParent();
    if (parent) {
      return multiplyMatrix(parent.getWorldTransform(), this.attrs.transform);
    }
    return [...this.attrs.transform];
  }

  protected children: SuikaGraphics[] = [];
  protected isContainer = false;

  getChildren() {
    if (!this.isContainer) {
      return [];
    }
    if (this._sortDirty) {
      this.sortChildren();
    }
    return [...this.children];
  }

  getChildrenCount() {
    return this.children.length;
  }

  setChildren(graphs: SuikaGraphics[]) {
    if (!this.isContainer) {
      return;
    }

    const sortKeys = generateNKeysBetween(null, null, graphs.length);
    for (let i = 0; i < graphs.length; i++) {
      const el = graphs[i];
      el.updateAttrs({
        parentIndex: {
          guid: this.attrs.id,
          position: sortKeys[i],
        },
      });
    }
  }

  insertAtParent(position: string) {
    const parent = this.getParent();
    if (parent) {
      parent.insertChild(this, position);
    }
  }

  insertChild(graphics: SuikaGraphics, sortIdx?: string) {
    if (!this.isContainer) {
      console.warn(`graphics "${this.type}" is not container`);
      return;
    }
    if (this.children.some((item) => item.attrs.id === graphics.attrs.id)) {
      if (sortIdx) {
        this.sortChildren();
      }
      return;
    }
    if (!sortIdx) {
      const maxSortIdx = this.getMaxChildIndex();
      sortIdx = generateKeyBetween(maxSortIdx, null);
    }

    graphics.removeFromParent(); // 这个应该要删除？
    const newParentIndex = {
      guid: this.attrs.id,
      position: sortIdx,
    };
    if (!isEqual(graphics.attrs.parentIndex, newParentIndex)) {
      graphics.updateAttrs({
        parentIndex: newParentIndex,
      });
    }

    this.children.push(graphics);
    if (sortIdx) {
      // TODO: 考虑 this._sortDirty 标记为 true，然后找个合适的时机再排序，减少图形重复地调用 sortChildren
      this.sortChildren();
    }
  }

  removeChild(graphics: SuikaGraphics) {
    this.children = this.children.filter(
      (item) => item.attrs.id !== graphics.attrs.id,
    );
  }

  hasAncestor(id: string): boolean {
    const parent = this.getParent();
    if (!parent) {
      return false;
    }
    return parent.attrs.id === id || parent.hasAncestor(id);
  }

  markSortDirty() {
    this._sortDirty = true;
  }

  sortChildren() {
    SuikaGraphics.sortGraphicsArray(this.children);
  }

  static sortGraphicsArray(graphicsArr: SuikaGraphics[]) {
    graphicsArr.sort((a, b) => {
      return (a.attrs.parentIndex?.position ?? '') <
        (b.attrs.parentIndex?.position ?? '')
        ? -1
        : 1;
    });
    return graphicsArr;
  }

  getParentId() {
    return this.attrs.parentIndex?.guid;
  }

  getParent() {
    const parentId = this.getParentId();
    if (!parentId) {
      return undefined;
    }
    return this.doc.getGraphicsById(parentId);
  }

  getParentWorldTransform() {
    const parent = this.getParent();
    return parent ? parent.getWorldTransform() : identityMatrix();
  }

  removeFromParent() {
    const parent = this.getParent();
    if (parent) {
      parent.removeChild(this);
    }
  }

  getMaxChildIndex() {
    if (this.children.length === 0) {
      return null;
    }
    if (!this._sortDirty) {
      return this.children.at(-1)!.getSortIndex() ?? null;
    }
    let maxIndex = this.children[0].getSortIndex()!;
    for (let i = 1; i < this.children.length; i++) {
      const currIndex = this.children[i].getSortIndex();
      if (currIndex > maxIndex) {
        maxIndex = currIndex;
      }
    }
    return maxIndex;
  }

  getMinChildIndex() {
    if (this.children.length === 0) {
      return null;
    }
    if (!this._sortDirty) {
      return this.children.at(0)!.getSortIndex() ?? null;
    }
    let minIndex = this.children[0].getSortIndex()!;
    for (let i = 1; i < this.children.length; i++) {
      const currIndex = this.children[i].getSortIndex();
      if (currIndex < minIndex) {
        minIndex = currIndex;
      }
    }
    return minIndex;
  }

  getSortIndex() {
    return this.attrs.parentIndex?.position ?? '';
  }

  getNextSibling() {
    const parent = this.getParent();
    if (!parent) {
      return null;
    }
    const children = parent.getChildren();
    const index = children.findIndex((item) => item === this);
    if (index == -1) {
      console.warn('index should not be -1!');
      return null;
    }
    for (let i = index + 1; i < children.length; i++) {
      if (!children[i].isDeleted()) {
        return children[i];
      }
    }
    return null;
  }

  getPrevSibling() {
    const parent = this.getParent();
    if (!parent) {
      return null;
    }
    const children = parent.getChildren();
    const index = children.findIndex((item) => item === this);
    if (index == -1) {
      console.warn('index should not be -1!');
      return null;
    }
    for (let i = index - 1; i >= 0; i--) {
      if (!children[i].isDeleted()) {
        return children[i];
      }
    }
    return null;
  }

  getSortIndexPath() {
    const path: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: SuikaGraphics | undefined = this;
    while (node) {
      path.push(node.getSortIndex());
      node = node.getParent();
    }
    path.reverse();
    return path;
  }

  static sortGraphics(graphics: SuikaGraphics[]) {
    const elements = graphics.map((item) => ({
      path: item.getSortIndexPath(),
      val: item,
    }));

    elements.sort((a, b) => {
      const len = Math.max(a.path.length, b.path.length);
      for (let i = 0; i < len; i++) {
        const sortIdxA = a.path[i];
        const sortIdxB = b.path[i];
        if (sortIdxA === sortIdxB) {
          continue;
        }
        return sortIdxA < sortIdxB ? -1 : 1;
      }
      return a.path.length < b.path.length ? -1 : 1;
    });
    return elements.map((item) => item.val);
  }

  containAncestor(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: SuikaGraphics | undefined = this;
    while (node) {
      if (node.attrs.id === id) {
        return true;
      }
      node = node.getParent();
    }
    return false;
  }

  forEachParent(
    callback: (
      graphics: SuikaGraphics,
      breakLoop: () => void,
    ) => boolean | void,
  ) {
    let breakFlag = false;
    const breakLoop = () => {
      breakFlag = true;
    };

    let node = this.getParent();
    while (node) {
      callback(node, breakLoop);
      if (breakFlag) break;
      node = node.getParent();
    }
  }

  getParentIds() {
    const ids: string[] = [];
    this.forEachParent((node) => {
      ids.push(node.attrs.id);
    });
    return ids;
  }

  getFrameParentIds() {
    const ids: string[] = [];
    this.forEachParent((node, breakLoop) => {
      if (node.type === GraphicsType.Canvas) {
        breakLoop();
        return;
      }
      ids.push(node.attrs.id);
    });
    return ids;
  }

  setWorldTransform(worldTf: IMatrixArr) {
    const parentTf = this.getParentWorldTransform();
    const localTf = multiplyMatrix(invertMatrix(parentTf), worldTf);
    this.updateAttrs({
      transform: localTf,
    });
  }

  forEachVisibleChildNode(callback: (graphics: SuikaGraphics) => void) {
    if (!this.isVisible()) {
      return;
    }
    for (const child of this.children) {
      child.forEachVisibleChildNode(callback);
    }
    callback(this);
  }
}
