import { cloneDeep, parseHexToRGBA, parseRGBAStr } from '@suika/common';
import {
  commandsToStr,
  getPointsBbox,
  getRegularPolygon,
  type IBox,
  type IMatrixArr,
  type IPathCommand,
  type IPoint,
  isPointInConvexPolygon,
  Matrix,
  roundPolygon,
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
  cornerRadius?: number;
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
    if (this.shouldSkipDraw(drawInfo)) return;

    const opacity = this.getOpacity() * (drawInfo.opacity ?? 1);
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
      const cmds = this.toPathCmds();

      layerCtx.beginPath();
      for (const cmd of cmds) {
        if (cmd.type === 'M') {
          layerCtx.moveTo(cmd.points[0].x, cmd.points[0].y);
        } else if (cmd.type === 'L') {
          layerCtx.lineTo(cmd.points[0].x, cmd.points[0].y);
        } else if (cmd.type === 'C') {
          layerCtx.bezierCurveTo(
            cmd.points[0].x,
            cmd.points[0].y,
            cmd.points[1].x,
            cmd.points[1].y,
            cmd.points[2].x,
            cmd.points[2].y,
          );
        } else if (cmd.type === 'Z') {
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
        label: 'C',
        key: 'cornerRadius',
        value: this.attrs.cornerRadius ?? 0,
        min: 0,
        max: 100,
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

    const cornerRadius = this.attrs.cornerRadius ?? 0;
    if (cornerRadius > 0) {
      return `<path d="${commandsToStr(
        this.toPathCmds(),
        10,
      )}" transform="matrix(${tf.join(' ')})"`;
    }
    const points = this.getPoints();
    return `<polygon points="${points
      .map((p) => `${p.x},${p.y}`)
      .join(' ')}" transform="matrix(${tf.join(' ')})"`;
  }

  private toPathCmds() {
    let cmds: IPathCommand[] = [];
    const points = this.getPoints();
    const cornerRadius = this.attrs.cornerRadius ?? 0;
    if (cornerRadius > 0) {
      cmds = roundPolygon(points, cornerRadius);
    } else {
      cmds = points.map((p, i) => ({
        type: i === 0 ? 'M' : 'L',
        points: [p],
      }));
      cmds.push({ type: 'Z', points: [] });
    }
    return cmds;
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

    const cmds = this.toPathCmds();
    for (const cmd of cmds) {
      cmd.points = cmd.points.map((p) => matrix.apply(p));
    }
    return commandsToStr(cmds, precision);
  }
}
