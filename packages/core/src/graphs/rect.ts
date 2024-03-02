import { parseHexToRGBA, parseRGBAStr } from '@suika/common';
import { isPointInRoundRect, transformRotate } from '@suika/geo';

import { ControlHandle } from '../control_handle_manager';
import { ImgManager } from '../Img_manager';
import { TextureType } from '../texture';
import { GraphType, IBox2WithRotation, IPoint } from '../type';
import { rotateInCanvas } from '../utils';
import { Ellipse } from './ellipse';
import { Graph, GraphAttrs } from './graph';

export interface RectAttrs extends GraphAttrs {
  cornerRadius?: number;
}

export class Rect extends Graph<RectAttrs> {
  override type = GraphType.Rect;

  constructor(options: Omit<RectAttrs, 'id'>) {
    super({ ...options, type: GraphType.Rect });
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

  override draw(
    ctx: CanvasRenderingContext2D,
    imgManager?: ImgManager,
    smooth?: boolean,
  ) {
    const attrs = this.attrs;
    if (attrs.rotation) {
      const cx = attrs.x + attrs.width / 2;
      const cy = attrs.y + attrs.height / 2;

      rotateInCanvas(ctx, attrs.rotation, cx, cy);
    }
    ctx.beginPath();
    if (attrs.cornerRadius) {
      ctx.roundRect(
        attrs.x,
        attrs.y,
        attrs.width,
        attrs.height,
        attrs.cornerRadius,
      );
    } else {
      ctx.rect(attrs.x, attrs.y, attrs.width, attrs.height);
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

  override drawOutline(
    ctx: CanvasRenderingContext2D,
    stroke: string,
    strokeWidth: number,
  ) {
    const attrs = this.attrs;
    if (attrs.rotation) {
      const cx = attrs.x + attrs.width / 2;
      const cy = attrs.y + attrs.height / 2;
      rotateInCanvas(ctx, attrs.rotation, cx, cy);
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    if (attrs.cornerRadius) {
      ctx.roundRect(
        attrs.x,
        attrs.y,
        attrs.width,
        attrs.height,
        attrs.cornerRadius,
      );
    } else {
      ctx.rect(attrs.x, attrs.y, attrs.width, attrs.height);
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
      this.attrs,
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
    const infos = [
      {
        type: 'nwCornerRadius',
        origin: { x: attrs.x, y: attrs.y },
        direction: { x: 1, y: 1 },
        cornerRadius: cornerRadii[0],
      },
      {
        type: 'neCornerRadius',
        origin: { x: attrs.x + attrs.width, y: attrs.y },
        direction: { x: -1, y: 1 },
        cornerRadius: cornerRadii[1],
      },
      {
        type: 'seCornerRadius',
        origin: { x: attrs.x + attrs.width, y: attrs.y + attrs.height },
        direction: { x: -1, y: -1 },
        cornerRadius: cornerRadii[2],
      },
      {
        type: 'swCornerRadius',
        origin: { x: attrs.x, y: attrs.y + attrs.height },
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
    oldBox: IBox2WithRotation,
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

      switch (type) {
        case 'nwCornerRadius': {
          a = { x: 1, y: 1 };
          b = { x: pos.x - attrs.x, y: pos.y - attrs.y };
          break;
        }
        case 'neCornerRadius': {
          a = { x: -1, y: 1 };
          b = { x: pos.x - (attrs.x + attrs.width), y: pos.y - attrs.y };
          break;
        }
        case 'seCornerRadius': {
          a = { x: -1, y: -1 };
          b = {
            x: pos.x - (attrs.x + attrs.width),
            y: pos.y - (attrs.y + attrs.height),
          };
          break;
        }
        case 'swCornerRadius': {
          a = { x: 1, y: -1 };
          b = { x: pos.x - attrs.x, y: pos.y - (attrs.y + attrs.height) };
          break;
        }
      }
      const dist = (a.x * b.x + a.y * b.y) / Math.sqrt(a.x * a.x + a.y * a.y);
      this.attrs.cornerRadius = Math.min(
        this.getMaxCornerRadius(),
        Math.round(Math.max(dist, 0) * Math.cos(Math.PI / 4)),
      );
    } else {
      super.updateByControlHandle(
        type,
        newPos,
        oldBox,
        keepRatio,
        scaleFromCenter,
      );
    }
  }
}
