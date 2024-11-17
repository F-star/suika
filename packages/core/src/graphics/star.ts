import { cloneDeep, parseHexToRGBA, parseRGBAStr } from '@suika/common';
import {
  getPointsBbox,
  getStar,
  type IBox,
  type IMatrixArr,
  type IPoint,
  isPointInPolygon,
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

interface StarAttrs extends GraphicsAttrs {
  count: number;
  starInnerScale: number;
}

export class SuikaStar extends SuikaGraphics<StarAttrs> {
  override type = GraphicsType.Star;

  constructor(
    attrs: Optional<StarAttrs, 'transform' | 'id'>,
    opts: IGraphicsOpts,
  ) {
    super(
      {
        ...attrs,
        type: GraphicsType.Star,
      },
      opts,
    );
  }

  override getAttrs(): StarAttrs {
    return cloneDeep({ ...this.attrs, count: this.attrs.count });
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      count: this.attrs.count,
    };
  }

  private getPoints() {
    return getStar(this.getSize(), this.attrs.count, this.attrs.starInnerScale);
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
    const { fill, strokeWidth, stroke, transform } =
      overrideStyle || this.attrs;

    const { ctx, imgManager, smooth } = drawInfo;
    ctx.save();
    ctx.transform(...transform);
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
      {
        label: 'T',
        key: 'starInnerScale',
        value: this.attrs.starInnerScale,
        min: 0.001,
        max: 1,
        uiType: 'percent',
      },
    ];
  }

  override updateAttrs(
    partialAttrs: Partial<StarAttrs> & IAdvancedAttrs,
    options?: { finishRecomputed?: boolean },
  ) {
    super.updateAttrs(partialAttrs, options);
  }

  override hitTest(point: IPoint, _padding?: number) {
    // TODO: solve padding
    const tf = new Matrix(...this.getWorldTransform());
    const pt = tf.applyInverse(point);
    return isPointInPolygon(this.getPoints(), pt);
  }

  protected override getSVGTagHead(offset?: IPoint) {
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
    return 'M6.5 2L7.51031 5.10942H10.7798L8.13472 7.03115L9.14503 10.1406L6.5 8.21885L3.85497 10.1406L4.86528 7.03115L2.22025 5.10942H5.48969L6.5 2Z';
  }
}
