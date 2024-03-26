import { omit, parseHexToRGBA, parseRGBAStr } from '@suika/common';
import {
  type IBox,
  isPointInRoundRect,
  rectToPoints,
  rectToVertices,
  resizeRect,
  transformRotate,
} from '@suika/geo';
import { Matrix } from 'pixi.js';

import { ControlHandle } from '../control_handle_manager';
import { type ImgManager } from '../Img_manager';
import { TextureType } from '../texture';
import { GraphType, type IBox2WithRotation, type IPoint } from '../type';
import { getAbsoluteCoords, rotateInCanvas } from '../utils';
import { Ellipse } from './ellipse';
import { Graph, type GraphAttrs } from './graph';

export interface RectAttrs extends GraphAttrs {
  cornerRadius?: number;
  transform: Matrix;
}

export class Rect extends Graph<RectAttrs> {
  override type = GraphType.Rect;

  constructor(options: Omit<RectAttrs, 'id' | 'transform'>) {
    super({ ...options, type: GraphType.Rect, transform: new Matrix() });
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

  override updateAttrs(attrs: Partial<RectAttrs>): void {
    if (attrs.x !== undefined) {
      this.attrs.transform.tx = attrs.x;
    }
    if (attrs.y !== undefined) {
      this.attrs.transform.ty = attrs.y;
    }
    super.updateAttrs(omit(attrs, 'x', 'y'));
  }

  override draw(
    ctx: CanvasRenderingContext2D,
    imgManager?: ImgManager,
    smooth?: boolean,
  ) {
    const attrs = this.attrs;

    const tf = attrs.transform;
    ctx.transform(tf.a, tf.b, tf.c, tf.d, tf.tx, tf.ty);

    ctx.beginPath();
    if (attrs.cornerRadius) {
      ctx.roundRect(0, 0, attrs.width, attrs.height, attrs.cornerRadius);
    } else {
      ctx.rect(0, 0, attrs.width, attrs.height);
    }

    for (const texture of attrs.fill ?? []) {
      switch (texture.type) {
        case TextureType.Solid: {
          ctx.fillStyle = parseRGBAStr(texture.attrs);
          ctx.fill();
          break;
        }
        case TextureType.Image: {
          if (imgManager) {
            const maxCornerRadius = this.getMaxCornerRadius();
            const cornerRadius = Math.min(
              attrs.cornerRadius ?? 0,
              maxCornerRadius,
            );
            this.fillImage(ctx, texture, imgManager, smooth, cornerRadius);
          } else {
            console.warn('ImgManager is not provided');
          }
        }
      }
    }
    if (attrs.strokeWidth) {
      ctx.lineWidth = attrs.strokeWidth;
      for (const texture of attrs.stroke ?? []) {
        switch (texture.type) {
          case TextureType.Solid: {
            ctx.strokeStyle = parseRGBAStr(texture.attrs);
            ctx.stroke();
            break;
          }
          case TextureType.Image: {
            // TODO: stroke image
          }
        }
      }
    }
    ctx.closePath();
  }

  protected override getPosition() {
    return {
      x: this.attrs.transform.tx,
      y: this.attrs.transform.ty,
    };
  }

  override getBBox(): Readonly<IBox> {
    if (this._cacheBbox) {
      return this._cacheBbox;
    }

    const vertices = rectToVertices({
      x: 0,
      y: 0,
      width: this.attrs.width,
      height: this.attrs.height,
    });

    const minX = Math.min(...vertices.map((v) => v.x));
    const minY = Math.min(...vertices.map((v) => v.y));
    const maxX = Math.max(...vertices.map((v) => v.x));
    const maxY = Math.max(...vertices.map((v) => v.y));

    this._cacheBbox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
    return this._cacheBbox;
  }

  /**
   * get rect before rotation
   */
  override getRect() {
    return {
      ...this.getPosition(),
      width: this.attrs.width,
      height: this.attrs.height,
    };
  }

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    const attrs = this.attrs;
    const pos = this.getPosition();
    if (attrs.rotation) {
      const cx = pos.x + attrs.width / 2;
      const cy = pos.y + attrs.height / 2;
      rotateInCanvas(ctx, attrs.rotation, cx, cy);
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    if (attrs.cornerRadius) {
      ctx.roundRect(
        pos.x,
        pos.y,
        attrs.width,
        attrs.height,
        attrs.cornerRadius,
      );
    } else {
      ctx.rect(pos.x, pos.y, attrs.width, attrs.height);
    }
    ctx.stroke();
    ctx.closePath();
  }

  private createCornerRadiusHandleGraph() {
    return new Ellipse({
      objectName: 'cornerRadius',
      x: 0,
      y: 0,
      width: 8,
      height: 8,
      fill: [{ type: TextureType.Solid, attrs: parseHexToRGBA('#fff')! }],
      stroke: [{ type: TextureType.Solid, attrs: parseHexToRGBA('#1592fe')! }],
      strokeWidth: 1,
    });
  }

  override hitTest(x: number, y: number, padding = 0): boolean {
    const maxCornerRadius = this.getMaxCornerRadius();
    return isPointInRoundRect(
      { x, y },
      this.getRect(),
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
    const rect = this.getRect();
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

      if (attrs.rotation) {
        const center = this.getCenter();
        const pos = transformRotate(x, y, attrs.rotation, center.x, center.y);
        x = pos.x;
        y = pos.y;
      }

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

  override updateByControlHandle(
    type: string,
    newPos: IPoint,
    oldBox: RectAttrs,
    keepRatio?: boolean,
    scaleFromCenter?: boolean,
  ) {
    const attrs = this.attrs;
    if (type.endsWith('CornerRadius')) {
      const center = this.getCenter();
      const pos = transformRotate(
        newPos.x,
        newPos.y,
        -(attrs.rotation ?? 0),
        center.x,
        center.y,
      );

      let a = { x: 0, y: 0 };
      let b = { x: 0, y: 0 };

      const rect = this.getRect();
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
      this.attrs.cornerRadius = Math.min(
        this.getMaxCornerRadius(),
        Math.round(Math.max(dist, 0) * Math.cos(Math.PI / 4)),
      );
    } else {
      // super.updateByControlHandle(
      //   type,
      //   newPos,
      //   oldBox,
      //   keepRatio,
      //   scaleFromCenter,
      // );

      const rect = resizeRect(type, newPos, oldBox, {
        keepRatio,
        scaleFromCenter,
      });
      this.updateAttrs(rect);
    }
  }
}
