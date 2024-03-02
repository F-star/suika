import { parseRGBAStr } from '@suika/common';
import { addPoint, IPoint, IRect, IRectWithRotation } from '@suika/geo';
import { Bezier } from 'bezier-js';

import { ImgManager } from '../../Img_manager';
import { TextureType } from '../../texture';
import { GraphType } from '../../type';
import { rotateInCanvas } from '../../utils';
import { Graph, GraphAttrs } from '../graph';

export interface ISegment {
  point: IPoint;
  /** the coordinates relative to point */
  handleIn: IPoint;
  /** the coordinates relative to point */
  handleOut: IPoint;
}

export interface PathAttrs extends GraphAttrs {
  pathData: ISegment[][];
}

export class Path extends Graph<PathAttrs> {
  override type = GraphType.Path;

  constructor(options: Omit<PathAttrs, 'id'>) {
    super({ ...options, type: GraphType.Path });
  }

  override getBBox(): IRect {
    // TODO: cache
    const pathData = this.attrs.pathData ?? [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const path of pathData) {
      for (let i = 1; i < path.length; i++) {
        const seg = path[i];
        const prevSeg = path[i - 1];
        const bbox = new Bezier(
          prevSeg.point,
          Path.getHandleOut(prevSeg),
          Path.getHandleIn(seg),
          seg.point,
        ).bbox();
        minX = Math.min(minX, bbox.x.min);
        minY = Math.min(minY, bbox.y.min);
        maxX = Math.max(maxX, bbox.x.max);
        maxY = Math.max(maxY, bbox.y.max);
      }
    }
    if (minX === Infinity) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  override getRectWithRotation(): IRectWithRotation {
    return { ...this.getBBox(), rotation: this.attrs.rotation };
  }

  override updateAttrs(attrs: Partial<PathAttrs>) {
    if (attrs.pathData) {
      this.attrs.pathData = attrs.pathData;
    }
    if (attrs.x !== undefined) {
      // move all points in pathData
      const originX = this.getRect().x;
      const dx = attrs.x - originX;
      const pathData = this.attrs.pathData;
      for (const pathItem of pathData) {
        for (const seg of pathItem) {
          seg.point.x += dx;
        }
      }
    }
    if (attrs.y !== undefined) {
      const originY = this.getRect().y;
      const dy = attrs.y - originY;
      const pathData = this.attrs.pathData;
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
    const { pathData, rotation, fill, strokeWidth, stroke } = this.attrs;
    if (rotation) {
      const { x: cx, y: cy } = this.getCenter();

      rotateInCanvas(ctx, rotation, cx, cy);
    }

    ctx.beginPath();
    for (const path of pathData) {
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

    for (const texture of fill ?? []) {
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
    if (strokeWidth) {
      ctx.lineWidth = strokeWidth;
      for (const texture of stroke ?? []) {
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
      pathData: this.attrs.pathData,
    };
  }

  static getHandleIn(seg: ISegment) {
    return addPoint(seg.point, seg.handleIn);
  }
  static getHandleOut(seg: ISegment) {
    return addPoint(seg.point, seg.handleOut);
  }

  getSeg(pathIdx: number, segIdx: number) {
    return Path.getSeg(this.attrs.pathData, pathIdx, segIdx);
  }
  static getSeg(pathData: ISegment[][], pathIdx: number, segIdx: number) {
    const pathDataItem = pathData[pathIdx];
    if (!pathDataItem) {
      return null;
    }
    return pathDataItem[segIdx] ?? null;
  }
  setSeg(pathIdx: number, segIdx: number, seg: ISegment) {
    const pathData = this.attrs.pathData;
    const pathDataItem = pathData[pathIdx];
    if (!pathDataItem) {
      throw new Error(`pathIdx ${pathIdx} is out of range`);
    }
    if (segIdx >= pathDataItem.length) {
      throw new Error(`segIdx ${segIdx} is out of range`);
    }
    pathDataItem[segIdx] = seg;
    this.updateAttrs({ pathData });
  }
}
