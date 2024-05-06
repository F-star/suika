import { parseHexToRGBA, parseRGBAStr } from '@suika/common';
import { boxToRect, type IPoint, isPointInRoundRect } from '@suika/geo';
import { Matrix } from 'pixi.js';

import { ControlHandle } from '../control_handle_manager';
import { type ImgManager } from '../Img_manager';
import { type IPaint, PaintType } from '../paint';
import { GraphType, type Optional } from '../type';
import { Ellipse } from './ellipse';
import { Graph, type GraphAttrs, type IGraphOpts } from './graph';

export interface RectAttrs extends GraphAttrs {
  cornerRadius?: number;
}

export class Rect extends Graph<RectAttrs> {
  override type = GraphType.Rect;

  constructor(
    attrs: Optional<RectAttrs, 'transform' | 'id'>,
    opts?: IGraphOpts,
  ) {
    super(
      {
        ...attrs,
        type: GraphType.Rect,
      },
      opts,
    );
  }

  override getAttrs(): RectAttrs {
    return { ...this.attrs, cornerRadius: this.attrs.cornerRadius ?? 0 };
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
    },
  ) {
    const attrs = this.attrs;
    const { fill, strokeWidth, stroke } = overrideStyle || this.attrs;

    ctx.transform(...attrs.transform);

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

  /**
   * get rect before transform
   */
  override getRect() {
    return {
      ...this.getPosition(),
      width: this.attrs.width,
      height: this.attrs.height,
    };
  }

  private createCornerRadiusHandleGraph() {
    return new Ellipse({
      objectName: 'cornerRadius',
      width: 8,
      height: 8,
      fill: [{ type: PaintType.Solid, attrs: parseHexToRGBA('#fff')! }],
      stroke: [{ type: PaintType.Solid, attrs: parseHexToRGBA('#1592fe')! }],
      strokeWidth: 1,
    });
  }

  override hitTest(x: number, y: number, padding = 0): boolean {
    const tf = new Matrix(...this.attrs.transform);
    const point = tf.applyInverse({ x, y });
    const maxCornerRadius = this.getMaxCornerRadius();
    return isPointInRoundRect(
      point,
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

      const tf = new Matrix(...attrs.transform);
      const pos = tf.apply({ x, y });
      x = pos.x;
      y = pos.y;

      const handle = new ControlHandle({
        cx: x,
        cy: y,
        type: info.type,
        graph: this.createCornerRadiusHandleGraph(),
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
    keepRatio?: boolean,
    scaleFromCenter?: boolean,
    flipWhenResize?: boolean,
  ): Partial<RectAttrs> {
    const newAttrs = {} as Partial<RectAttrs>;
    if (type.endsWith('CornerRadius')) {
      const attrs = this.attrs;
      const tf = new Matrix(...attrs.transform);
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

  /**
   * parse to svg string
   * for debug
   * wip
   */
  toSVG() {
    const container = boxToRect(this.getBboxWithStroke());
    const center = this.getCenter();
    const offsetX = container.width / 2 - center.x;
    const offsetY = container.height / 2 - center.y;
    const tf = [...this.attrs.transform];
    tf[4] += offsetX;
    tf[5] += offsetY;
    const matrixStr = tf.join(' ');

    const svgHead = `<svg width="${container.width}" height="${container.height}" viewBox="0 0 ${container.width} ${container.height}" fill="none" xmlns="http://www.w3.org/2000/svg">`;
    const content = `<rect width="${this.attrs.width}" height="${
      this.attrs.height
    }" transform="matrix(${matrixStr})" fill="#D9D9D9" stroke="black" stroke-width="${this.getStrokeWidth()}"></rect>`;
    const svgTail = `</svg>`;
    return svgHead + '\n' + content + '\n' + svgTail;
  }
}
