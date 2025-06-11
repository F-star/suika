import { parseRGBAStr } from '@suika/common';
import {
  commandsToStr,
  ellipseToPathCmds,
  type IPoint,
  Matrix,
} from '@suika/geo';

import { DOUBLE_PI } from '../constant';
import { PaintType } from '../paint';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';
import { type IDrawInfo } from './type';
import { drawLayer } from './utils';

export type EllipseAttrs = GraphicsAttrs;

export class SuikaEllipse extends SuikaGraphics<EllipseAttrs> {
  override type = GraphicsType.Ellipse;

  constructor(
    attrs: Optional<EllipseAttrs, 'id' | 'transform'>,
    opts: IGraphicsOpts,
  ) {
    super({ ...attrs, type: GraphicsType.Ellipse }, opts);
  }

  override hitTest(point: IPoint, padding = 0) {
    const attrs = this.attrs;
    const cx = attrs.width / 2;
    const cy = attrs.height / 2;
    const strokeWidth = (attrs.strokeWidth || 0) / 2;
    padding = padding + strokeWidth;
    const w = attrs.width / 2 + padding;
    const h = attrs.height / 2 + padding;

    const tf = new Matrix(...this.getWorldTransform());
    const rotatedHitPoint = tf.applyInverse(point);

    return (
      (rotatedHitPoint.x - cx) ** 2 / w ** 2 +
        (rotatedHitPoint.y - cy) ** 2 / h ** 2 <=
      1
    );
  }

  override draw(drawInfo: IDrawInfo) {
    if (this.shouldSkipDraw(drawInfo)) return;

    const opacity = this.getOpacity() * (drawInfo.opacity ?? 1);
    const { ctx, imgManager, smooth } = drawInfo;
    const attrs = this.attrs;
    const cx = attrs.width / 2;
    const cy = attrs.height / 2;

    ctx.save();
    ctx.transform(...attrs.transform);
    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }

    const draw = (layerCtx: CanvasRenderingContext2D) => {
      layerCtx.beginPath();
      layerCtx.ellipse(
        cx,
        cy,
        attrs.width / 2,
        attrs.height / 2,
        0,
        0,
        DOUBLE_PI,
      );
      for (const paint of attrs.fill ?? []) {
        if (paint.visible === false) continue;
        if (paint.type === PaintType.Solid) {
          layerCtx.fillStyle = parseRGBAStr(paint.attrs);
          layerCtx.fill();
        } else if (paint.type === PaintType.Image) {
          if (imgManager) {
            layerCtx.clip();
            this.fillImage(layerCtx, paint, imgManager, smooth);
          } else {
            console.warn('ImgManager is not provided');
          }
        }
      }

      if (attrs.strokeWidth) {
        layerCtx.lineWidth = attrs.strokeWidth;
        for (const paint of attrs.stroke ?? []) {
          if (paint.visible === false) continue;
          if (paint.type === PaintType.Solid) {
            layerCtx.strokeStyle = parseRGBAStr(paint.attrs);
            layerCtx.stroke();
          } else if (paint.type === PaintType.Image) {
            // TODO:
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

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    const { width, height } = this.attrs;
    const cx = width / 2;
    const cy = height / 2;

    ctx.transform(...this.getWorldTransform());

    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, DOUBLE_PI);
    ctx.stroke();
    ctx.closePath();
  }

  override getSVGTagHead(offset?: IPoint) {
    const tf = [...this.attrs.transform];
    if (offset) {
      tf[4] += offset.x;
      tf[5] += offset.y;
    }

    const cx = this.attrs.width / 2;
    const cy = this.attrs.height / 2;

    if (this.attrs.width === this.attrs.height) {
      return `<circle cx="${cx}" cy="${cy}" r="${cx}" transform="matrix(${tf.join(
        ' ',
      )})"`;
    } else {
      return `<ellipse cx="${cx}" cy="${cy}" rx="${cx}" ry="${cy}" transform="matrix(${tf.join(
        ' ',
      )})"`;
    }
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

    const attrs = this.attrs;
    const commands = ellipseToPathCmds({
      x: 0,
      y: 0,
      width: attrs.width,
      height: attrs.height,
    });
    commands.forEach((cmd) => {
      cmd.points.forEach((pt, idx) => {
        cmd.points[idx] = matrix.apply(pt);
      });
    });

    return commandsToStr(commands, precision);
  }
}
