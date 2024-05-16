import { parseHexToRGBA, parseRGBAStr } from '@suika/common';
import {
  getRegularPolygon,
  type IPoint,
  isPointInConvexPolygon,
} from '@suika/geo';
import { Matrix, type Optional } from 'pixi.js';

import { type ImgManager } from '../Img_manager';
import { type IPaint, PaintType } from '../paint';
import { GraphType } from '../type';
import { Graph, type GraphAttrs, type IGraphOpts } from './graph';

interface RegularPolygonAttrs extends GraphAttrs {
  count: number;
}

export class RegularPolygon extends Graph<RegularPolygonAttrs> {
  override type = GraphType.RegularPolygon;

  constructor(
    attrs: Optional<RegularPolygonAttrs, 'transform' | 'id'>,
    opts?: IGraphOpts,
  ) {
    super(
      {
        ...attrs,
        type: GraphType.RegularPolygon,
      },
      opts,
    );
  }

  override getAttrs(): RegularPolygonAttrs {
    return { ...this.attrs, count: this.attrs.count };
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      count: this.attrs.count,
    };
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
    },
  ) {
    const attrs = this.attrs;
    const { fill, strokeWidth, stroke } = overrideStyle || this.attrs;

    ctx.transform(...attrs.transform);

    const points = getRegularPolygon(this.getSize(), attrs.count);

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
    partialAttrs: Partial<RegularPolygonAttrs> & IGraphOpts,
    options?: { finishRecomputed?: boolean },
  ) {
    super.updateAttrs(partialAttrs, options);
  }

  override hitTest(x: number, y: number, _padding?: number) {
    // TODO: solve padding
    const tf = new Matrix(...this.attrs.transform);
    const point = tf.applyInverse({ x, y });
    return isPointInConvexPolygon(
      getRegularPolygon(this.getSize(), this.attrs.count),
      point,
    );
  }

  override getSVGTagHead(offset?: IPoint) {
    const tf = [...this.attrs.transform];
    if (offset) {
      tf[4] += offset.x;
      tf[5] += offset.y;
    }

    const points = getRegularPolygon(this.getSize(), this.attrs.count);

    return `<polygon points="${points
      .map((p) => `${p.x},${p.y}`)
      .join(' ')}" transform="matrix(${tf.join(' ')})"`;
  }
}
