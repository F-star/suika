import { parseRGBAStr } from '@suika/common';
import {
  addPoint,
  getRectByPoints,
  IPoint,
  IRect,
  IRectWithRotation,
} from '@suika/geo';

import { ImgManager } from '../Img_manager';
import { TextureType } from '../texture';
import { GraphType } from '../type';
import { rotateInCanvas } from '../utils';
import { Graph, GraphAttrs } from './graph';

export interface ISegment {
  point: IPoint;
  /** the coordinates relative to point */
  handleIn: IPoint;
  /** the coordinates relative to point */
  handleOut: IPoint;
}

export interface PathAttrs extends GraphAttrs {
  pathData?: ISegment[][];
}

export class Path extends Graph {
  pathData: ISegment[][];

  constructor(options: PathAttrs) {
    super({ ...options, type: GraphType.Path });
    this.pathData = options.pathData ?? [];
  }

  override getBBox(): IRect {
    const points: IPoint[] = [];
    const pathData = this.pathData;
    for (const path of pathData) {
      for (const seg of path) {
        points.push(seg.point, Path.getHandleIn(seg), Path.getHandleOut(seg));
      }
    }
    const rect = getRectByPoints(points);
    return rect;
  }

  override getRectWithRotation(): IRectWithRotation {
    return { ...this.getBBox(), rotation: this.rotation };
  }

  override updateAttrs(attrs: Partial<PathAttrs>) {
    if (attrs.pathData) {
      this.pathData = attrs.pathData;
    }
    if (attrs.x !== undefined) {
      // move all points in pathData
      const originX = this.getRect().x;
      const dx = attrs.x - originX;
      const pathData = this.pathData;
      for (const pathItem of pathData) {
        for (const seg of pathItem) {
          seg.point.x += dx;
        }
      }
    }
    if (attrs.y !== undefined) {
      const originY = this.getRect().y;
      const dy = attrs.y - originY;
      const pathData = this.pathData;
      for (const pathItem of pathData) {
        for (const seg of pathItem) {
          seg.point.y += dy;
        }
      }
    }
    super.updateAttrs(attrs);
  }

  override getRect() {
    return this.getBBox();
  }

  override draw(
    ctx: CanvasRenderingContext2D,
    imgManager?: ImgManager | undefined,
    smooth?: boolean | undefined,
  ) {
    if (this.rotation) {
      const { x: cx, y: cy } = this.getCenter();

      rotateInCanvas(ctx, this.rotation, cx, cy);
    }

    ctx.beginPath();
    for (const path of this.pathData) {
      const first = path[0];
      ctx.moveTo(first.point.x, first.point.y);
      for (let i = 1; i < path.length; i++) {
        const currSeg = path[i];
        const prevSeg = path[i - 1];
        const pointX = currSeg.point.x;
        const pointY = currSeg.point.y;
        const handle1 = Path.getHandleOut(prevSeg);
        const handle2 = Path.getHandleIn(currSeg);
        if (!handle1 && !handle2) {
          ctx.lineTo(pointX, pointY);
        } else {
          ctx.bezierCurveTo(
            handle1.x,
            handle1.y,
            handle2.x,
            handle2.y,
            pointX,
            pointY,
          );
        }
      }
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
            ctx.clip();
            this.fillImage(ctx, texture, imgManager, smooth);
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

  override toJSON() {
    return {
      ...super.toJSON(),
      pathData: this.pathData,
    };
  }

  override getAttrs(): PathAttrs {
    return {
      ...super.getAttrs(),
      pathData: this.pathData,
    };
  }

  static getHandleIn(seg: ISegment) {
    return addPoint(seg.point, seg.handleIn);
  }
  static getHandleOut(seg: ISegment) {
    return addPoint(seg.point, seg.handleOut);
  }
}
