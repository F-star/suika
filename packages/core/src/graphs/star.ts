import { parseHexToRGBA, parseRGBAStr } from '@suika/common';
import {
  getPointsBbox,
  getStar,
  type IBox,
  type IMatrixArr,
  type IPoint,
  isPointInPolygon,
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
    return { ...this.attrs, count: this.attrs.count };
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

  override draw(
    ctx: CanvasRenderingContext2D,
    imgManager?: ImgManager,
    smooth?: boolean,
  ) {
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
    const { fill, strokeWidth, stroke, transform } =
      overrideStyle || this.attrs;

    ctx.save();
    ctx.transform(...transform);

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
      {
        label: 'T',
        key: 'starInnerScale',
        value: this.attrs.starInnerScale,
        min: 0.0010000000474974513,
        max: 1,
        uiType: 'number',
      },
    ];
  }

  override updateAttrs(
    partialAttrs: Partial<StarAttrs> & IAdvancedAttrs,
    options?: { finishRecomputed?: boolean },
  ) {
    super.updateAttrs(partialAttrs, options);
  }

  override hitTest(x: number, y: number, _padding?: number) {
    // TODO: solve padding
    const tf = new Matrix(...this.getWorldTransform());
    const point = tf.applyInverse({ x, y });
    return isPointInPolygon(this.getPoints(), point);
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
}
