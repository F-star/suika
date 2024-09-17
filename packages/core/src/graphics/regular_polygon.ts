import { cloneDeep, parseHexToRGBA, parseRGBAStr } from '@suika/common';
import {
  getPointsBbox,
  getRegularPolygon,
  type IBox,
  type IMatrixArr,
  type IPoint,
  isPointInConvexPolygon,
  Matrix,
} from '@suika/geo';

import { type ImgManager } from '../Img_manager';
import { type IPaint, PaintType } from '../paint';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IAdvancedAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';

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

  override draw(
    ctx: CanvasRenderingContext2D,
    imgManager?: ImgManager,
    smooth?: boolean,
  ) {
    if (!this.isVisible()) return;
    this._realDraw(ctx, imgManager, smooth);
  }

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    this._realDraw(ctx, undefined, undefined, {
      stroke: [{ type: PaintType.Solid, attrs: parseHexToRGBA(stroke)! }],
      strokeWidth,
      transform: this.getWorldTransform(),
    });
  }

  private _realDraw(
    ctx: CanvasRenderingContext2D,
    imgManager?: ImgManager,
    smooth?: boolean,
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

    ctx.save();
    ctx.transform(...(transform ?? attrs.transform));

    const points = this.getPoints();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();

    for (const paint of fill ?? []) {
      switch (paint.type) {
        case PaintType.Solid: {
          ctx.fillStyle = parseRGBAStr(paint.attrs);
          ctx.fill();
          break;
        }
        case PaintType.Image: {
          if (imgManager) {
            ctx.clip();
            this.fillImage(ctx, paint, imgManager, smooth);
          } else {
            console.warn('ImgManager is not provided');
          }
        }
      }
    }

    if (strokeWidth) {
      ctx.lineWidth = strokeWidth;
      for (const paint of stroke ?? []) {
        switch (paint.type) {
          case PaintType.Solid: {
            ctx.strokeStyle = parseRGBAStr(paint.attrs);
            ctx.stroke();
            break;
          }
          case PaintType.Image: {
            // TODO: stroke image
          }
        }
      }
    }
    ctx.closePath();
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
}
