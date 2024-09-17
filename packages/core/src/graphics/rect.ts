import { cloneDeep, parseHexToRGBA, parseRGBAStr } from '@suika/common';
import {
  type IMatrixArr,
  type IPoint,
  isPointInRoundRect,
  Matrix,
} from '@suika/geo';

import { ControlHandle } from '../control_handle_manager';
import { type ImgManager } from '../Img_manager';
import { type IPaint, PaintType } from '../paint';
import { GraphicsType, type Optional } from '../type';
import { SuikaEllipse } from './ellipse';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';

export interface RectAttrs extends GraphicsAttrs {
  cornerRadius?: number;
}

export class SuikaRect extends SuikaGraphics<RectAttrs> {
  override type = GraphicsType.Rect;

  constructor(
    attrs: Optional<RectAttrs, 'transform' | 'id'>,
    opts: IGraphicsOpts,
  ) {
    super(
      {
        ...attrs,
        type: GraphicsType.Rect,
      },
      opts,
    );
  }

  override getAttrs(): RectAttrs {
    return cloneDeep({
      ...this.attrs,
      cornerRadius: this.attrs.cornerRadius ?? 0,
    });
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      cornerRadius: this.attrs.cornerRadius,
    };
  }

  private getMaxCornerRadius() {
    return Math.min(this.attrs.width, this.attrs.height) / 2;
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
    ctx.transform(...transform);

    ctx.beginPath();
    if (attrs.cornerRadius) {
      ctx.roundRect(0, 0, attrs.width, attrs.height, attrs.cornerRadius);
    } else {
      ctx.rect(0, 0, attrs.width, attrs.height);
    }

    for (const paint of fill ?? []) {
      switch (paint.type) {
        case PaintType.Solid: {
          ctx.fillStyle = parseRGBAStr(paint.attrs);
          ctx.fill();
          break;
        }
        case PaintType.Image: {
          if (imgManager) {
            const maxCornerRadius = this.getMaxCornerRadius();
            const cornerRadius = Math.min(
              attrs.cornerRadius ?? 0,
              maxCornerRadius,
            );
            this.fillImage(ctx, paint, imgManager, smooth, cornerRadius);
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

  /**
   * get rect before transform
   */
  override getRect() {
    return {
      ...this.getLocalPosition(),
      width: this.attrs.width,
      height: this.attrs.height,
    };
  }

  private createCornerRadiusHandleGraph() {
    return new SuikaEllipse(
      {
        objectName: 'cornerRadius',
        width: 8,
        height: 8,
        fill: [{ type: PaintType.Solid, attrs: parseHexToRGBA('#fff')! }],
        stroke: [{ type: PaintType.Solid, attrs: parseHexToRGBA('#1592fe')! }],
        strokeWidth: 1,
      },
      { doc: this.doc },
    );
  }

  override hitTest(point: IPoint, padding = 0): boolean {
    const tf = new Matrix(...this.getWorldTransform());
    const pt = tf.applyInverse(point);
    const maxCornerRadius = this.getMaxCornerRadius();
    return isPointInRoundRect(
      pt,
      {
        x: 0,
        y: 0,
        width: this.attrs.width,
        height: this.attrs.height,
      },
      new Array(4).fill(
        Math.min(this.attrs.cornerRadius ?? 0, maxCornerRadius),
      ),
      padding + (this.attrs.strokeWidth ?? 0) / 2,
    );
  }

  override getControlHandles(zoom: number, initial?: boolean) {
    let minCornerRadius = 0;
    if (initial) {
      minCornerRadius = 14 / zoom;
    }

    const MIN_SIZE_TO_SHOW_HANDLE = 108;
    const attrs = this.attrs;
    if (
      attrs.width * zoom < MIN_SIZE_TO_SHOW_HANDLE ||
      attrs.height * zoom < MIN_SIZE_TO_SHOW_HANDLE
    ) {
      return [];
    }
    const maxCornerRadius = Math.min(attrs.width, attrs.height) / 2;
    const cornerRadius = attrs.cornerRadius ?? 0;
    const cornerRadii = [
      cornerRadius,
      cornerRadius,
      cornerRadius,
      cornerRadius,
    ];

    const handles: ControlHandle[] = [];
    const rect = {
      x: 0,
      y: 0,
      width: attrs.width,
      height: attrs.height,
    };
    const infos = [
      {
        type: 'nwCornerRadius',
        origin: { x: rect.x, y: rect.y },
        direction: { x: 1, y: 1 },
        cornerRadius: cornerRadii[0],
      },
      {
        type: 'neCornerRadius',
        origin: { x: rect.x + rect.width, y: rect.y },
        direction: { x: -1, y: 1 },
        cornerRadius: cornerRadii[1],
      },
      {
        type: 'seCornerRadius',
        origin: { x: rect.x + rect.width, y: rect.y + rect.height },
        direction: { x: -1, y: -1 },
        cornerRadius: cornerRadii[2],
      },
      {
        type: 'swCornerRadius',
        origin: { x: rect.x, y: rect.y + rect.height },
        direction: { x: 1, y: -1 },
        cornerRadius: cornerRadii[3],
      },
    ];
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      let cornerRadius = info.cornerRadius;
      if (cornerRadius < minCornerRadius) {
        cornerRadius = minCornerRadius;
      } else if (cornerRadius > maxCornerRadius) {
        cornerRadius = maxCornerRadius;
      }

      let x = info.origin.x + info.direction.x * cornerRadius;
      let y = info.origin.y + info.direction.y * cornerRadius;

      const tf = new Matrix(...this.getWorldTransform());
      const pos = tf.apply({ x, y });
      x = pos.x;
      y = pos.y;

      const handle = new ControlHandle({
        cx: x,
        cy: y,
        type: info.type,
        graphics: this.createCornerRadiusHandleGraph(),
        getCursor: () => 'default',
      });
      handles.push(handle);
    }
    return handles;
  }

  override calcNewAttrsByControlHandle(
    type: string,
    newPos: IPoint,
    oldBox: RectAttrs,
    oldWorldTransform: IMatrixArr,
    keepRatio?: boolean,
    scaleFromCenter?: boolean,
    flipWhenResize?: boolean,
  ): Partial<RectAttrs> {
    const newAttrs = {} as Partial<RectAttrs>;
    if (type.endsWith('CornerRadius')) {
      const attrs = this.attrs;
      const tf = new Matrix(...oldWorldTransform);
      const pos = tf.applyInverse(newPos);

      let a = { x: 0, y: 0 };
      let b = { x: 0, y: 0 };

      const rect = {
        x: 0,
        y: 0,
        width: attrs.width,
        height: attrs.height,
      };
      switch (type) {
        case 'nwCornerRadius': {
          a = { x: 1, y: 1 };
          b = { x: pos.x - rect.x, y: pos.y - rect.y };
          break;
        }
        case 'neCornerRadius': {
          a = { x: -1, y: 1 };
          b = { x: pos.x - (rect.x + rect.width), y: pos.y - rect.y };
          break;
        }
        case 'seCornerRadius': {
          a = { x: -1, y: -1 };
          b = {
            x: pos.x - (rect.x + rect.width),
            y: pos.y - (rect.y + rect.height),
          };
          break;
        }
        case 'swCornerRadius': {
          a = { x: 1, y: -1 };
          b = { x: pos.x - rect.x, y: pos.y - (rect.y + rect.height) };
          break;
        }
      }
      const dist = (a.x * b.x + a.y * b.y) / Math.sqrt(a.x * a.x + a.y * a.y);
      newAttrs.cornerRadius = Math.min(
        this.getMaxCornerRadius(),
        Math.round(Math.max(dist, 0) * Math.cos(Math.PI / 4)),
      );
    } else {
      Object.assign(
        newAttrs,
        super.calcNewAttrsByControlHandle(
          type,
          newPos,
          oldBox,
          oldWorldTransform,
          keepRatio,
          scaleFromCenter,
          flipWhenResize,
        ),
      );
    }
    return newAttrs;
  }

  override getInfoPanelAttrs() {
    return [
      ...super.getInfoPanelAttrs(),
      {
        label: 'C',
        key: 'cornerRadius',
        value: this.attrs.cornerRadius ?? 0,
        uiType: 'number',
      },
    ];
  }

  override getSVGTagHead(offset?: IPoint) {
    const tf = [...this.attrs.transform];
    if (offset) {
      tf[4] += offset.x;
      tf[5] += offset.y;
    }

    const cornerRadius = this.attrs.cornerRadius ?? 0;
    const cornerRadiusStr = cornerRadius > 1 ? ` rx="${cornerRadius}"` : '';

    return `<rect width="${this.attrs.width}" height="${
      this.attrs.height
    }" transform="matrix(${tf.join(' ')})"${cornerRadiusStr}`;
  }
}
