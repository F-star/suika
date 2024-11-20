import { parseRGBAStr } from '@suika/common';
import {
  boxToRect,
  type IMatrixArr,
  type IPoint,
  isPointInBox,
  isPointInTransformedRect,
  Matrix,
  mergeBoxes,
} from '@suika/geo';

import { type IPaint, PaintType } from '../../paint';
import { GraphicsType, type Optional } from '../../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from '../graphics';
import { type IDrawInfo, type IHitOptions } from '../type';

interface FrameAttrs extends GraphicsAttrs {
  resizeToFit: boolean;
}

export class SuikaFrame extends SuikaGraphics<FrameAttrs> {
  override type = GraphicsType.Frame;
  protected override isContainer = true;

  constructor(
    attrs: Optional<FrameAttrs, 'id' | 'transform'>,
    opts: IGraphicsOpts,
  ) {
    super({ ...attrs, type: GraphicsType.Frame }, opts);
  }

  // children 中有图形 size 进行了更新，frame 需要重新 size
  updateSizeByChildren(
    originAttrsMap: Map<string, Partial<GraphicsAttrs>>,
    updatedAttrsMap: Map<string, Partial<GraphicsAttrs>>,
  ) {
    const boundingRect = boxToRect(
      mergeBoxes(
        this.children
          .filter((item) => item.isVisible())
          .map((item) => item.getLocalBbox()),
      ),
    );

    // TODO:
    // 子节点被删除，自己也要被删除。
    // 字节点全都隐藏了，自己的宽高要换成 NaN，然后不能被选中，计算时不贡献 size

    if (
      boundingRect.x === 0 &&
      boundingRect.y === 0 &&
      boundingRect.width === this.attrs.width &&
      boundingRect.height === this.attrs.height
    ) {
      // size has no changed
      return;
    }

    for (const child of this.children) {
      const id = child.attrs.id;

      originAttrsMap.set(
        id,
        Object.assign(
          {
            transform: [...child.attrs.transform],
          },
          originAttrsMap.get(id) ?? {},
        ),
      );

      const tf = new Matrix(...child.attrs.transform).translate(
        -boundingRect.x,
        -boundingRect.y,
      );
      child.updateAttrs({
        transform: tf.getArray(),
      });

      const updatedAttrs = Object.assign(updatedAttrsMap.get(id) ?? {}, {
        transform: [...child.attrs.transform],
      });
      updatedAttrsMap.set(id, updatedAttrs);
    }

    const translateTf = new Matrix().translate(boundingRect.x, boundingRect.y);
    const tf = new Matrix(...this.attrs.transform).append(translateTf);

    const id = this.attrs.id;
    if (!originAttrsMap.has(id)) {
      originAttrsMap.set(id, {
        width: this.attrs.width,
        height: this.attrs.height,
        transform: [...this.attrs.transform],
      });
    }

    const updatedAttrs = {
      width: boundingRect.width,
      height: boundingRect.height,
      transform: tf.getArray(),
    };
    this.updateAttrs(updatedAttrs);
    updatedAttrsMap.set(id, updatedAttrs);
  }

  isEmpty() {
    return this.children.length === 0;
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
    ctx.transform(...transform);
    const opacity = drawInfo.opacity ?? 1;
    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }
    ctx.beginPath();

    // TODO: support cornerRadius
    ctx.rect(0, 0, attrs.width, attrs.height);

    // FIXME: move to viewport coord
    // ctx.save();
    // ctx.fillStyle = '#acacac';
    // ctx.fillText(attrs.objectName, 0, 0);
    // ctx.restore();

    for (const paint of fill ?? []) {
      switch (paint.type) {
        case PaintType.Solid: {
          ctx.fillStyle = parseRGBAStr(paint.attrs);
          ctx.fill();
          break;
        }
        case PaintType.Image: {
          if (imgManager) {
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

  isGroup() {
    return this.attrs.resizeToFit;
  }

  drawText(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (!this.isVisible()) return;
    const rotation = this.getRotate();
    const matrix = new Matrix()
      .translate(-x, -y)
      .rotate(rotation)
      .translate(x, y);
    ctx.save();
    ctx.fillStyle = '#acacac';
    ctx.font = '11px sans-serif';
    ctx.transform(...matrix.getArray());
    ctx.fillText(this.attrs.objectName, x, y);
    ctx.restore();
  }

  override draw(drawInfo: IDrawInfo) {
    const opacity = this.getOpacity() * (drawInfo.opacity ?? 1);
    if (!this.isVisible() || opacity === 0) return;

    drawInfo = {
      ...drawInfo,
      opacity: opacity,
    };

    if (!this.isGroup()) {
      this._realDraw(drawInfo);
    }
    const { ctx } = drawInfo;
    if (!this.isGroup()) {
      ctx.save();
      // ctx.transform(...this.attrs.transform);
      // ctx.beginPath();
      // ctx.rect(0, 0, this.attrs.width, this.attrs.height);
      ctx.clip();
    }
    super.draw(drawInfo);
    if (!this.isGroup()) {
      ctx.restore();
    }
  }

  override hitTest(point: IPoint, padding = 0): boolean {
    const tf = new Matrix(...this.getWorldTransform());
    const pt = tf.applyInverse(point);
    return isPointInBox(
      {
        minX: 0,
        minY: 0,
        maxX: this.attrs.width,
        maxY: this.attrs.height,
      },
      pt,
      padding + (this.attrs.strokeWidth ?? 0) / 2,
    );
  }

  override getHitGraphics(
    point: IPoint,
    options: IHitOptions,
  ): SuikaGraphics | null {
    if (!this.isVisible() || this.isLock()) return null;

    const { parentIdSet } = options;
    const children = this.getChildren();
    if (this.isGroup()) {
      // (1) Group
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        const hitGraphics = child.getHitGraphics(point, options);
        if (hitGraphics) {
          const parent = hitGraphics.getParent();
          if (parent && !parentIdSet.has(parent.attrs.id)) {
            return parent;
          }
          return hitGraphics;
        }
      }

      // hit frame title
      if (this.isHitTitle(point, options)) {
        return this;
      }
    } else {
      // (2) Frame
      if (children.length === 0) {
        return super.getHitGraphics(point, options);
      }
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        const hitGraphics = child.getHitGraphics(point, options);
        if (hitGraphics) {
          return hitGraphics;
        }
      }
      // hit frame title
      if (this.isHitTitle(point, options)) {
        return this;
      }
    }

    return null;
  }

  private isHitTitle(point: IPoint, options: IHitOptions) {
    const textHeight = 12;
    const height = textHeight / options.zoom;
    const width = 80 / options.zoom;
    const worldTf = new Matrix(...this.getWorldTransform()).append(
      new Matrix().translate(0, -height),
    );
    const titleRect = {
      width,
      height,
      transform: worldTf.getArray(),
    };
    return isPointInTransformedRect(point, titleRect, options.tol);
  }

  override getLayerIconPath() {
    if (this.isGroup()) {
      return 'M7 1H5V2H7V1ZM9.5 10H10V9.5H11V11H9.5V10ZM2 5V7H1V5H2ZM10 2.5V2H9.5V1H11V2.5H10ZM10 5V7H11V5H10ZM2 2.5V2H2.5V1H1V2.5H2ZM1 9.5H2V10H2.5V11H1V9.5ZM7 10H5V11H7V10Z';
    }
    return 'M4 0.5V3H8V0.5H9V3H11.5V4H9V8H11.5V9H9V11.5H8V9H4V11.5H3V9H0.5V8H3V4H0.5V3H3V0.5H4ZM8 8V4H4V8H8Z';
  }
}

export const isFrameGraphics = (
  graphics: SuikaGraphics,
): graphics is SuikaFrame => {
  return graphics instanceof SuikaFrame;
};
