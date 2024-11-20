import { cloneDeep, parseHexToRGBA, parseRGBAStr } from '@suika/common';
import {
  commandsToStr,
  getPointsBbox,
  getRegularPolygon,
  type IBox,
  type IMatrixArr,
  type IPoint,
  isPointInConvexPolygon,
  Matrix,
} from '@suika/geo';

import { type IPaint, PaintType } from '../paint';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IAdvancedAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';
import { type IDrawInfo } from './type';
import { drawLayer } from './utils';

interface RegularPolygonAttrs extends GraphicsAttrs {
  count: number;
}

export class SuikaRegularPolygon extends SuikaGraphics<RegularPolygonAttrs> {
  override type = GraphicsType.RegularPolygon;

  constructor(
    attrs: Optional<RegularPolygonAttrs, 'transform' | 'id'>,
    opts: IGraphicsOpts,
  ) {
    super(
      {
        ...attrs,
        type: GraphicsType.RegularPolygon,
      },
      opts,
    );
  }

  override getAttrs(): RegularPolygonAttrs {
    return cloneDeep({ ...this.attrs, count: this.attrs.count });
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      count: this.attrs.count,
    };
  }

  private getPoints() {
    return getRegularPolygon(this.getSize(), this.attrs.count);
  }

  override getMinBbox(): Readonly<IBox> {
    if (this._cacheMinBbox) {
      return this._cacheMinBbox;
    }
    const tf = new Matrix(...this.attrs.transform);
    const points = this.getPoints().map((pt) => tf.apply(pt));
    const bbox = getPointsBbox(points);
    this._cacheMinBbox = bbox;
    return bbox;
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
        stroke: [{ type: PaintType.Solid, attrs: parseHexToRGBA(stroke)! }],
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
      transform: IMatrixArr;
    },
  ) {
    const attrs = this.attrs;
    const { fill, strokeWidth, stroke, transform } =
      overrideStyle || this.attrs;

    const { ctx, imgManager, smooth } = drawInfo;
    ctx.save();
    ctx.transform(...(transform ?? attrs.transform));
    const opacity = drawInfo.opacity ?? 1;
    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }

    const draw = (layerCtx: CanvasRenderingContext2D) => {
      const points = this.getPoints();

      layerCtx.beginPath();
      layerCtx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const point = points[i];
        layerCtx.lineTo(point.x, point.y);
      }
      layerCtx.closePath();

      for (const paint of fill ?? []) {
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

  override getInfoPanelAttrs() {
    return [
      ...super.getInfoPanelAttrs(),
      {
        label: 'N',
        key: 'count',
        value: this.attrs.count,
        min: 3,
        max: 60,
        uiType: 'number',
      },
    ];
  }

  override updateAttrs(
    partialAttrs: Partial<RegularPolygonAttrs> & IAdvancedAttrs,
    options?: { finishRecomputed?: boolean },
  ) {
    super.updateAttrs(partialAttrs, options);
  }

  override hitTest(point: IPoint, _padding?: number) {
    // TODO: solve padding
    const tf = new Matrix(...this.getWorldTransform());
    const pt = tf.applyInverse(point);
    return isPointInConvexPolygon(this.getPoints(), pt);
  }

  override getSVGTagHead(offset?: IPoint) {
    const tf = [...this.attrs.transform];
    if (offset) {
      tf[4] += offset.x;
      tf[5] += offset.y;
    }

    const points = this.getPoints();

    return `<polygon points="${points
      .map((p) => `${p.x},${p.y}`)
      .join(' ')}" transform="matrix(${tf.join(' ')})"`;
  }

  override getLayerIconPath() {
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

    const points = this.getPoints().map((p) => matrix.apply(p));

    return commandsToStr(
      [
        { type: 'M', points: [points[0]] },
        ...points.slice(1).map((p) => ({ type: 'L', points: [p] })),
        { type: 'Z', points: [] },
      ],
      precision,
    );
  }
}
