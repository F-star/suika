import { calcCoverScale } from '@suika/common';
import { Assets, Container, Graphics, Matrix, Sprite } from 'pixi.js';

import { DOUBLE_PI } from '../constant';
import { PaintType } from '../paint';
import { GraphType, type Optional } from '../type';
import { Graph, type GraphAttrs, type IGraphOpts } from './graph';

export type EllipseAttrs = GraphAttrs;

export class Ellipse extends Graph<EllipseAttrs> {
  override type = GraphType.Ellipse;

  constructor(
    attrs: Optional<EllipseAttrs, 'id' | 'transform'>,
    opts?: IGraphOpts,
  ) {
    super({ ...attrs, type: GraphType.Ellipse }, opts);
  }

  override hitTest(x: number, y: number, padding = 0) {
    const attrs = this.attrs;
    const cx = attrs.width / 2;
    const cy = attrs.height / 2;
    const strokeWidth = (attrs.strokeWidth || 0) / 2;
    padding = padding + strokeWidth;
    const w = attrs.width / 2 + padding;
    const h = attrs.height / 2 + padding;

    const tf = new Matrix(...this.attrs.transform);
    const rotatedHitPoint = tf.applyInverse({ x, y });

    return (
      (rotatedHitPoint.x - cx) ** 2 / w ** 2 +
        (rotatedHitPoint.y - cy) ** 2 / h ** 2 <=
      1
    );
  }

  override draw(): // ctx: CanvasRenderingContext2D,
  // imgManager?: ImgManager,
  // smooth?: boolean,
  void {
    // const attrs = this.attrs;
    // const cx = attrs.width / 2;
    // const cy = attrs.height / 2;

    // ctx.transform(...attrs.transform);

    // ctx.beginPath();
    // ctx.ellipse(cx, cy, attrs.width / 2, attrs.height / 2, 0, 0, DOUBLE_PI);
    // for (const paint of attrs.fill ?? []) {
    //   if (paint.type === PaintType.Solid) {
    //     ctx.fillStyle = parseRGBAStr(paint.attrs);
    //     ctx.fill();
    //   } else if (paint.type === PaintType.Image) {
    //     if (imgManager) {
    //       ctx.clip();
    //       this.fillImage(ctx, paint, imgManager, smooth);
    //     } else {
    //       console.warn('ImgManager is not provided');
    //     }
    //   }
    // }

    // if (attrs.strokeWidth) {
    //   ctx.lineWidth = attrs.strokeWidth;
    //   for (const paint of attrs.stroke ?? []) {
    //     if (paint.type === PaintType.Solid) {
    //       ctx.strokeStyle = parseRGBAStr(paint.attrs);
    //       ctx.stroke();
    //     } else if (paint.type === PaintType.Image) {
    //       // TODO:
    //     }
    //   }
    // }

    // ctx.closePath();

    this.drawByPixi();
  }

  // override drawByPixi() {
  //   if (!this.graphics) {
  //     this.graphics = new Graphics();
  //   }
  //   const graphics = this.graphics as Graphics;

  //   graphics.clear();

  //   const attrs = this.attrs;
  //   graphics.setFromMatrix(new Matrix(...attrs.transform));
  //   const halfWidth = attrs.width / 2;
  //   const halfHeight = attrs.height / 2;

  //   for (const paint of this.attrs.fill ?? []) {
  //     if (paint.type === PaintType.Solid) {
  //       graphics.ellipse(halfWidth, halfHeight, halfWidth, halfHeight);
  //       graphics.fill(paint.attrs);
  //     }
  //   }

  //   const strokeWidth = this.getStrokeWidth();
  //   for (const paint of this.attrs.stroke ?? []) {
  //     if (paint.type === PaintType.Solid) {
  //       graphics.ellipse(halfWidth, halfHeight, halfWidth, halfHeight);
  //       graphics.stroke({ width: strokeWidth, color: paint.attrs });
  //     }
  //   }

  //   this.graphics = graphics;
  //   return graphics;
  // }

  /**
   * TODO: 和 rect 的逻辑重复了，考虑抽一个公共方法
   */
  override drawByPixi() {
    if (!this.graphics) {
      this.graphics = new Container();
    }

    const _draw = () => {
      const graphics = this.graphics;
      if (!graphics) return;

      // reset
      graphics.removeChildren();
      graphics.mask = null;

      const attrs = this.attrs;
      graphics.visible = attrs.visible ?? true;
      graphics.setFromMatrix(new Matrix(...attrs.transform));
      const halfWidth = attrs.width / 2;
      const halfHeight = attrs.height / 2;

      const fillContainer = new Container();
      graphics.addChild(fillContainer);

      // mask
      if (imgUrlSet.size) {
        const mask = new Graphics()
          .ellipse(halfWidth, halfHeight, halfWidth, halfHeight)
          .fill();
        fillContainer.addChild(mask);
        fillContainer.mask = mask;
      }

      // fill
      for (const paint of this.attrs.fill ?? []) {
        if (paint.type === PaintType.Solid) {
          const solidGraphics = new Graphics()
            .ellipse(halfWidth, halfHeight, halfWidth, halfHeight)
            .fill(paint.attrs);
          fillContainer.addChild(solidGraphics);
        } else if (paint.type === PaintType.Image) {
          const sprite = Sprite.from(paint.attrs.src!);

          const img = sprite.texture.source;
          const scale = calcCoverScale(
            img.width,
            img.height,
            attrs.width,
            attrs.height,
          );
          const sx = (img.width * scale) / 2 - attrs.width / 2;
          const sy = (img.height * scale) / 2 - attrs.height / 2;

          sprite.x = -sx;
          sprite.y = -sy;
          sprite.width = img.width * scale;
          sprite.height = img.height * scale;

          fillContainer.addChild(sprite);
        }
      }

      // stroke
      const strokeWidth = this.getStrokeWidth();
      for (const paint of this.attrs.stroke ?? []) {
        if (paint.type === PaintType.Solid) {
          const solidGraphics = new Graphics()
            .ellipse(halfWidth, halfHeight, halfWidth, halfHeight)
            .stroke({ width: strokeWidth, color: paint.attrs });

          graphics.addChild(solidGraphics);
        }
      }
    };

    const imgUrlSet = this.getImgUrlSet();
    if (imgUrlSet.size) {
      Assets.load(Array.from(imgUrlSet)).then(_draw);
    } else {
      _draw();
    }
  }

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    const { width, height, transform } = this.attrs;
    const cx = width / 2;
    const cy = height / 2;

    ctx.transform(...transform);

    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, DOUBLE_PI);
    ctx.stroke();
    ctx.closePath();
  }
}
