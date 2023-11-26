import { GraphType, IBox2WithRotation, IPoint } from '../../type';
import { rotateInCanvas } from '../../utils/canvas';
import { parseHexToRGBA, parseRGBAStr } from '../../utils/color';
import { ImgManager } from '../Img_manager';
import { TextureType } from '../texture';
import { Graph, GraphAttrs } from './graph';
import { ControlHandle } from './control_handle_manager';
import { Ellipse } from './ellipse';
import { transformRotate } from '@suika/geo';

export interface RectAttrs extends GraphAttrs {
  cornerRadius?: number;
}

export class Rect extends Graph {
  private cornerRadius?: number;

  constructor(options: RectAttrs) {
    super({ ...options, type: GraphType.Rect });
    if (options.cornerRadius !== undefined) {
      this.cornerRadius = options.cornerRadius;
    }
  }

  override getAttrs(): RectAttrs {
    return {
      ...super.getAttrs(),
      cornerRadius: this.cornerRadius,
    };
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      cornerRadius: this.cornerRadius,
    };
  }

  override draw(
    ctx: CanvasRenderingContext2D,
    imgManager?: ImgManager,
    smooth?: boolean,
  ) {
    if (this.rotation) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;

      rotateInCanvas(ctx, this.rotation, cx, cy);
    }
    ctx.beginPath();
    if (this.cornerRadius) {
      ctx.roundRect(this.x, this.y, this.width, this.height, this.cornerRadius);
    } else {
      ctx.rect(this.x, this.y, this.width, this.height);
    }

    for (const texture of this.fill) {
      switch (texture.type) {
        case TextureType.Solid: {
          ctx.fillStyle = parseRGBAStr(texture.attrs);
          ctx.fill();
          break;
        }
        case TextureType.Image: {
          if (imgManager) {
            const maxCornerRadius = Math.min(this.width, this.height) / 2;
            const cornerRadius = Math.min(
              this.cornerRadius ?? 0,
              maxCornerRadius,
            );
            this.fillImage(ctx, texture, imgManager, smooth, cornerRadius);
          } else {
            console.warn('ImgManager is not provided');
          }
        }
      }
    }
    if (this.strokeWidth) {
      ctx.lineWidth = this.strokeWidth;
      for (const texture of this.stroke) {
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
    if (this.rotation) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      rotateInCanvas(ctx, this.rotation, cx, cy);
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    if (this.cornerRadius) {
      ctx.roundRect(this.x, this.y, this.width, this.height, this.cornerRadius);
    } else {
      ctx.rect(this.x, this.y, this.width, this.height);
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

  override getControlHandles(zoom: number, initial?: boolean) {
    let minCornerRadius = 0;
    if (initial) {
      minCornerRadius = 14 / zoom;
    }

    const MIN_SIZE_TO_SHOW_HANDLE = 108;
    if (
      this.width * zoom < MIN_SIZE_TO_SHOW_HANDLE ||
      this.height * zoom < MIN_SIZE_TO_SHOW_HANDLE
    ) {
      return [];
    }
    const maxCornerRadius = Math.min(this.width, this.height) / 2;
    const cornerRadius = this.cornerRadius ?? 0;
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
        origin: { x: this.x, y: this.y },
        direction: { x: 1, y: 1 },
        cornerRadius: cornerRadii[0],
      },
      {
        type: 'neCornerRadius',
        origin: { x: this.x + this.width, y: this.y },
        direction: { x: -1, y: 1 },
        cornerRadius: cornerRadii[1],
      },
      {
        type: 'seCornerRadius',
        origin: { x: this.x + this.width, y: this.y + this.height },
        direction: { x: -1, y: -1 },
        cornerRadius: cornerRadii[2],
      },
      {
        type: 'swCornerRadius',
        origin: { x: this.x, y: this.y + this.height },
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

      if (this.rotation) {
        const center = this.getCenter();
        const pos = transformRotate(x, y, this.rotation, center.x, center.y);
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
  ): void {
    if (type.endsWith('CornerRadius')) {
      const center = this.getCenter();
      const pos = transformRotate(
        newPos.x,
        newPos.y,
        -(this.rotation ?? 0),
        center.x,
        center.y,
      );

      let a = { x: 0, y: 0 };
      let b = { x: 0, y: 0 };

      switch (type) {
        case 'nwCornerRadius': {
          a = { x: 1, y: 1 };
          b = { x: pos.x - this.x, y: pos.y - this.y };
          break;
        }
        case 'neCornerRadius': {
          a = { x: -1, y: 1 };
          b = { x: pos.x - (this.x + this.width), y: pos.y - this.y };
          break;
        }
        case 'seCornerRadius': {
          a = { x: -1, y: -1 };
          b = {
            x: pos.x - (this.x + this.width),
            y: pos.y - (this.y + this.height),
          };
          break;
        }
        case 'swCornerRadius': {
          a = { x: 1, y: -1 };
          b = { x: pos.x - this.x, y: pos.y - (this.y + this.height) };
          break;
        }
      }
      const dist = (a.x * b.x + a.y * b.y) / Math.sqrt(a.x * a.x + a.y * a.y);
      this.cornerRadius = Math.round(Math.max(dist, 0) * Math.cos(Math.PI / 4));
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
