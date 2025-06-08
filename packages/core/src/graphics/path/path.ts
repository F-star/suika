import { cloneDeep, parseHexToRGBA, parseRGBAStr } from '@suika/common';
import {
  commandsToStr,
  deletePathSegAndHeal,
  distance,
  GeoPath,
  type IMatrixArr,
  insertPathSeg,
  invertMatrix,
  type IPathItem,
  type IPoint,
  type IRect,
  type ISegment,
  type ITransformRect,
  Matrix,
  multiplyMatrix,
  pointAdd,
  resizeLine,
  resizeRect,
} from '@suika/geo';

import { type IPaint, PaintType } from '../../paint';
import { GraphicsType, type Optional } from '../../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from '../graphics';
import { type IDrawInfo } from '../type';
import { drawLayer } from '../utils';

export interface PathAttrs extends GraphicsAttrs {
  pathData: IPathItem[];
}

export class SuikaPath extends SuikaGraphics<PathAttrs> {
  override type = GraphicsType.Path;
  private geoPath: GeoPath | null = null;

  constructor(
    attrs: Optional<PathAttrs, 'id' | 'transform'>,
    opts: IGraphicsOpts,
  ) {
    super({ ...attrs, type: GraphicsType.Path }, opts);
  }

  static computeRect(pathData: IPathItem[]): IRect {
    const geoPath = new GeoPath(pathData);
    return geoPath.getBRect();
  }

  static recomputeAttrs(pathData: IPathItem[], transform: IMatrixArr) {
    const rect = SuikaPath.computeRect(pathData);
    for (const pathItem of pathData) {
      for (const seg of pathItem.segs) {
        seg.point = {
          x: seg.point.x - rect.x,
          y: seg.point.y - rect.y,
        };
      }
    }
    const offset = new Matrix(...transform).apply(rect);
    return {
      x: offset.x,
      y: offset.y,
      width: rect.width,
      height: rect.height,
      pathData,
    };
  }

  private checkAndFixUpdatedAttrs(partialAttrs: Partial<PathAttrs>) {
    if (
      ('width' in partialAttrs || 'height' in partialAttrs) &&
      'pathData' in partialAttrs
    ) {
      delete partialAttrs.width;
      delete partialAttrs.height;
      console.warn(
        'width or height and pathData cannot coexist when updating attribute, removed width and height',
      );
    }
  }

  protected override clearBboxCache(): void {
    super.clearBboxCache();
    this.geoPath = null;
  }

  private getGeoPath() {
    if (!this.geoPath) {
      this.geoPath = new GeoPath(this.attrs.pathData);
    }
    return this.geoPath!;
  }

  /**
   * update attributes
   * TODO: optimize
   */
  override updateAttrs(
    partialAttrs: Partial<PathAttrs>,
    opts?: { finishRecomputed?: boolean },
  ) {
    if (opts?.finishRecomputed) {
      super.updateAttrs(partialAttrs);
      return;
    }

    partialAttrs = cloneDeep(partialAttrs);
    this.checkAndFixUpdatedAttrs(partialAttrs);

    const keys = Object.keys(partialAttrs);

    if (partialAttrs.pathData) {
      const transform = partialAttrs.transform ?? this.attrs.transform;
      this.attrs.pathData = partialAttrs.pathData;
      partialAttrs = {
        ...partialAttrs,
        ...SuikaPath.recomputeAttrs(partialAttrs.pathData!, transform),
      };
    }

    if (keys.includes('width') || keys.includes('height')) {
      const newPathData = this.recomputedPathData(
        partialAttrs.width ?? this.attrs.width,
        partialAttrs.height ?? this.attrs.height,
      );
      this.attrs.pathData = newPathData;
    }

    super.updateAttrs(partialAttrs);
  }

  override calcNewAttrsByControlHandle(
    /** 'se' | 'ne' | 'nw' | 'sw' | 'n' | 'e' | 's' | 'w' */
    type: string,
    newPos: IPoint,
    oldRect: ITransformRect,
    oldWorldTransform: IMatrixArr,
    keepRatio?: boolean,
    scaleFromCenter?: boolean,
    flipWhenResize?: boolean,
  ): Partial<PathAttrs> {
    const parentTf = this.getParentWorldTransform();
    oldRect = {
      width: oldRect.width,
      height: oldRect.height,
      transform: oldWorldTransform,
    };

    const rect =
      this.attrs.height === 0
        ? resizeLine(type, newPos, oldRect, {
            keepPolarSnap: keepRatio,
            scaleFromCenter: scaleFromCenter,
          })
        : resizeRect(type, newPos, oldRect, {
            keepRatio: keepRatio,
            scaleFromCenter: scaleFromCenter,
            flip: flipWhenResize,
          });
    rect.transform = multiplyMatrix(invertMatrix(parentTf), rect.transform);
    const newAttrs: Partial<PathAttrs> = rect;
    const newPathData = this.recomputedPathData(rect.width, rect.height);
    return { ...newAttrs, pathData: newPathData };
  }

  private recomputedPathData(width: number, height: number) {
    const scaleX = width / (this.attrs.width || 1);
    const scaleY = height / (this.attrs.height || 1);

    const pathData = cloneDeep(this.attrs.pathData);
    for (const pathItem of pathData) {
      for (const seg of pathItem.segs) {
        seg.point.x *= scaleX;
        seg.point.y *= scaleY;
        seg.in.x *= scaleX;
        seg.in.y *= scaleY;
        seg.out.x *= scaleX;
        seg.out.y *= scaleY;
      }
    }
    return pathData;
  }

  override draw(drawInfo: IDrawInfo) {
    const opacity = this.getOpacity() * (drawInfo.opacity ?? 1);
    if (!this.isVisible() || opacity === 0) return;
    this._realDraw({ ...drawInfo, opacity });
  }

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    this._realDraw(
      { ctx },
      {
        stroke: [
          {
            type: PaintType.Solid,
            attrs: parseHexToRGBA(stroke)!,
          },
        ],
        strokeWidth,
        transform: this.getWorldTransform(),
      },
    );
  }

  private _realDraw(
    drawInfo: IDrawInfo,
    overrideStyle?: {
      fill?: IPaint[];
      stroke?: IPaint[];
      strokeWidth?: number;
      transform?: IMatrixArr;
    },
  ) {
    const { pathData } = this.attrs;
    const transform = overrideStyle?.transform ?? this.attrs.transform;
    const { fill, strokeWidth, stroke } = overrideStyle || this.attrs;
    const { ctx, imgManager, smooth } = drawInfo;
    ctx.save();
    ctx.transform(...transform);
    const opacity = drawInfo.opacity ?? 1;
    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }

    const draw = (layerCtx: CanvasRenderingContext2D) => {
      layerCtx.beginPath();
      for (const pathItem of pathData) {
        const first = pathItem.segs[0];
        if (!first) continue;
        layerCtx.moveTo(first.point.x, first.point.y);

        const segs = pathItem.segs;
        for (let i = 1; i <= segs.length; i++) {
          if (i === segs.length && !pathItem.closed) {
            continue;
          }
          const currSeg = segs[i % segs.length];
          const prevSeg = segs[i - 1];
          const pointX = currSeg.point.x;
          const pointY = currSeg.point.y;
          const handle1 = SuikaPath.getHandleOut(prevSeg);
          const handle2 = SuikaPath.getHandleIn(currSeg);
          if (!handle1 && !handle2) {
            layerCtx.lineTo(pointX, pointY);
          } else {
            layerCtx.bezierCurveTo(
              handle1.x,
              handle1.y,
              handle2.x,
              handle2.y,
              pointX,
              pointY,
            );
          }
        }
        if (pathItem.closed) {
          layerCtx.closePath();
        }
      }

      for (const paint of fill ?? []) {
        if (paint.visible === false) continue;
        switch (paint.type) {
          case PaintType.Solid: {
            layerCtx.fillStyle = parseRGBAStr(paint.attrs);
            layerCtx.fill();
            break;
          }
          case PaintType.Image: {
            if (imgManager) {
              layerCtx.clip();
              this.fillImage(layerCtx, paint, imgManager, smooth);
            } else {
              console.warn('ImgManager is not provided');
            }
          }
        }
      }
      if (strokeWidth) {
        layerCtx.lineWidth = strokeWidth;
        for (const paint of stroke ?? []) {
          if (paint.visible === false) continue;
          switch (paint.type) {
            case PaintType.Solid: {
              layerCtx.strokeStyle = parseRGBAStr(paint.attrs);
              layerCtx.stroke();
              break;
            }
            case PaintType.Image: {
              // TODO: stroke image
            }
          }
        }
      }
      layerCtx.closePath();
    };

    if (opacity !== 1) {
      drawLayer({
        originCtx: ctx,
        viewSize: this.doc.getDeviceViewSize(),
        draw,
      });
    } else {
      draw(ctx);
    }
    ctx.restore();
  }

  override hitTest(point: IPoint, tol = 0): boolean {
    if (!super.hitTest(point, tol)) {
      return false;
    }
    if (this.attrs.fill?.length) {
      // TODO: fill hit test
      return true;
    }

    const tf = new Matrix(...this.getWorldTransform());
    const pt = tf.applyInverse(point);
    const geoPath = this.getGeoPath();
    return geoPath.hitTest(pt, tol + this.getStrokeWidth() / 2);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      pathData: this.attrs.pathData,
    };
  }

  static getHandleIn(seg: ISegment) {
    return pointAdd(seg.point, seg.in);
  }
  static getHandleOut(seg: ISegment) {
    return pointAdd(seg.point, seg.out);
  }
  static getSeg(pathData: IPathItem[], pathIdx: number, segIdx: number) {
    const pathDataItem = pathData[pathIdx];
    if (!pathDataItem) {
      return null;
    }
    return pathDataItem.segs[segIdx] ?? null;
  }

  getLastSeg(pathIdx: number, options?: { applyTransform: boolean }) {
    const lastSegIdx = this.getSegCount(pathIdx) - 1;
    return this.getSeg(pathIdx, lastSegIdx, options);
  }

  getSeg(
    pathIdx: number,
    segIdx: number,
    options?: { applyTransform: boolean },
  ) {
    let seg = SuikaPath.getSeg(this.attrs.pathData, pathIdx, segIdx);
    seg = cloneDeep(seg);
    if (seg && options?.applyTransform) {
      const tf = new Matrix(...this.getWorldTransform());
      const transformedPt = tf.apply(seg.point);
      seg.point.x = transformedPt.x;
      seg.point.y = transformedPt.y;

      tf.tx = 0;
      tf.ty = 0;
      const inPt = tf.apply(seg.in);
      seg.in.x = inPt.x;
      seg.in.y = inPt.y;
      const outPt = tf.apply(seg.out);
      seg.out.x = outPt.x;
      seg.out.y = outPt.y;
    }
    return seg;
  }

  getClosestAnchor(params: { point: IPoint; tol: number }) {
    const tf = new Matrix(...this.getWorldTransform());
    const point = tf.applyInverse(params.point);

    const pathData = this.attrs.pathData;

    let minDist = Infinity;
    let minPoint: IPoint | null = null;
    let minSegIdx = -1;
    let minPathIdx = -1;

    for (let pathIdx = 0; pathIdx < pathData.length; pathIdx++) {
      const pathItem = pathData[pathIdx];
      for (let i = pathItem.segs.length - 1; i >= 0; i--) {
        const seg = pathItem.segs[i];

        const dist = distance(seg.point, point);
        if (dist < params.tol) {
          minDist = dist;
          minPoint = seg.point;
          minSegIdx = i;
          minPathIdx = pathIdx;
        }
      }
    }

    if (!minPoint) {
      return null;
    }
    return {
      pathItemIndex: minPathIdx,
      segIndex: minSegIdx,
      dist: minDist,
      point: tf.apply(minPoint),
    };
  }

  project(point: IPoint, tol = Infinity) {
    const geoPath = this.getGeoPath();
    const tf = new Matrix(...this.getWorldTransform());
    point = tf.applyInverse(point);
    const data = geoPath.project(point, tol);
    if (!data) {
      return null;
    }
    return {
      dist: data.dist,
      point: tf.apply(data.point),
      pathItemIndex: data.index[0],
      segIndex: data.index[1],
      t: data.t,
    };
  }

  setSeg(pathIdx: number, segIdx: number, partialSeg: Partial<ISegment>) {
    const pathData = this.attrs.pathData;
    const pathItem = { ...pathData[pathIdx] };
    const seg = this.getSeg(pathIdx, segIdx);
    if (!seg) {
      throw new Error(`can not find pathIdx ${pathIdx} segIdx ${segIdx}`);
    }

    partialSeg = cloneDeep(partialSeg);
    const transform = this.getWorldTransform();
    if (partialSeg.point) {
      const tf = new Matrix(...transform);
      const anchor = tf.invert().apply(partialSeg.point);
      partialSeg.point.x = anchor.x;
      partialSeg.point.y = anchor.y;
    }
    if (partialSeg.in || partialSeg.out) {
      const invertTf = new Matrix(
        transform[0],
        transform[1],
        transform[2],
        transform[3],
        0,
        0,
      ).invert();
      if (partialSeg.in) {
        const inPt = invertTf.apply(partialSeg.in);
        partialSeg.in.x = inPt.x;
        partialSeg.in.y = inPt.y;
      }
      if (partialSeg.out) {
        const outPt = invertTf.apply(partialSeg.out);
        partialSeg.out.x = outPt.x;
        partialSeg.out.y = outPt.y;
      }
    }

    pathItem.segs[segIdx] = {
      ...seg,
      ...partialSeg,
    };
    this.updateAttrs({ pathData });
  }
  addSeg(pathIdx: number, seg: ISegment) {
    const pathData = this.attrs.pathData;
    const pathItem = pathData[pathIdx];
    if (!pathItem) {
      throw new Error(`pathIdx ${pathIdx} is out of range`);
    }
    const tf = new Matrix(...this.getWorldTransform());
    const anchor = tf.invert().apply(seg.point);
    pathItem.segs.push({
      point: anchor,
      in: seg.in,
      out: seg.out,
    });
    this.updateAttrs({ pathData });
  }
  addEmptyPath() {
    const pathData = this.attrs.pathData;
    pathData.push({
      segs: [],
      closed: false,
    });
    this.updateAttrs({ pathData });
  }
  setPathItemClosed(pathIdx: number, closed: boolean) {
    const pathData = this.attrs.pathData;
    const pathItem = pathData[pathIdx];
    if (!pathItem) {
      throw new Error(`pathIdx ${pathIdx} is out of range`);
    }
    pathItem.closed = closed;
    this.updateAttrs({ pathData });
  }
  checkPathItemClosed(pathIdx: number) {
    const pathData = this.attrs.pathData;
    const pathItem = pathData[pathIdx];
    if (!pathItem) {
      throw new Error(`pathIdx ${pathIdx} is out of range`);
    }
    return pathItem.closed;
  }
  getPathItemCount() {
    return this.attrs.pathData.length;
  }
  hasPath(pathIdx: number) {
    return !!this.attrs.pathData[pathIdx];
  }
  getSegCount(pathIdx: number) {
    const pathItem = this.attrs.pathData[pathIdx];
    if (!pathItem) {
      return 0;
    }
    return pathItem.segs.length;
  }

  deleteSegAndHeal(pathIdx: number, segIdx: number) {
    const pathData = cloneDeep(this.attrs.pathData);
    const pathItem = pathData[pathIdx];
    if (!pathItem) {
      throw new Error(`can not find pathIdx ${pathIdx}`);
    }
    deletePathSegAndHeal(pathItem, segIdx);
    this.updateAttrs({ pathData });
  }

  insertSeg(pathIdx: number, leftSegIdx: number, t: number) {
    // TODO: fix one segment case
    const pathData = cloneDeep(this.attrs.pathData);
    const pathItem = pathData[pathIdx];
    if (!pathItem) {
      throw new Error(`can not find pathIdx ${pathIdx}`);
    }
    insertPathSeg(pathItem, leftSegIdx, t);
    this.updateAttrs({ pathData });
  }

  override getSVGTagHead(offset?: IPoint) {
    const tf = [...this.attrs.transform];
    if (offset) {
      tf[4] += offset.x;
      tf[5] += offset.y;
    }

    let d = '';

    // TODO: optimize, it's duplicated with _realDraw method
    for (const pathItem of this.attrs.pathData) {
      const firstSeg = pathItem.segs[0];
      if (!firstSeg) continue;

      d += `M${firstSeg.point.x} ${firstSeg.point.y}`;

      const segs = pathItem.segs;
      for (let i = 1; i <= segs.length; i++) {
        if (i === segs.length && !pathItem.closed) {
          continue;
        }
        const currSeg = segs[i % segs.length];
        const prevSeg = segs[i - 1];
        const pointX = currSeg.point.x;
        const pointY = currSeg.point.y;
        const handle1 = SuikaPath.getHandleOut(prevSeg);
        const handle2 = SuikaPath.getHandleIn(currSeg);
        if (!handle1 && !handle2) {
          d += `L${pointX} ${pointY}`;
        } else {
          d += `C${handle1.x} ${handle1.y} ${handle2.x} ${handle2.y} ${pointX} ${pointY}`;
        }
      }
      if (pathItem.closed) {
        d += 'Z';
      }
    }

    return `<path d="${d}" transform="matrix(${tf.join(' ')})"`;
  }

  override getLayerIconPath(): string {
    const containerSize = 12;
    const padding = 0.5;
    const precision = 5;

    const targetSize = containerSize - padding * 2;

    const bbox = this.getBbox();
    const bboxWidth = bbox.maxX - bbox.minX;
    const bboxHeight = bbox.maxY - bbox.minY;
    const scale = targetSize / Math.max(bboxWidth, bboxHeight);

    const matrix = new Matrix()
      .prepend(new Matrix(...this.getWorldTransform()))
      .translate(-bbox.minX - bboxWidth / 2, -bbox.minY - bboxHeight / 2)
      .scale(scale, scale)
      .translate(containerSize / 2, containerSize / 2);

    const geoPath = this.getGeoPath();
    const commands = geoPath.toCommands();
    commands.forEach((cmd) => {
      cmd.points.forEach((pt, idx) => {
        cmd.points[idx] = matrix.apply(pt);
      });
    });

    return commandsToStr(commands, precision);
  }
}
