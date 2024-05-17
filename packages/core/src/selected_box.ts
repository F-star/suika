import { EventEmitter } from '@suika/common';
import {
  type IPoint,
  isPointInRect,
  type ITransformRect,
  rectToVertices,
} from '@suika/geo';

import { type Editor } from './editor';

interface Events {
  hoverChange(isHover: boolean): void;
}

export class SelectedBox {
  private box: ITransformRect | null = null;
  private eventEmitter = new EventEmitter<Events>();
  private _hover = false;

  constructor(private editor: Editor) {}

  isHover() {
    return this._hover;
  }

  getBox(): ITransformRect | null {
    return this.box ? { ...this.box } : null;
  }

  updateBbox() {
    const selectedElements = this.editor.selectedElements;

    const count = selectedElements.size();
    if (count > 0) {
      if (count === 1) {
        const selectedGraph = selectedElements.getItems()[0];
        const rect = selectedGraph.getBbox();
        this.box = {
          width: Math.abs(rect.maxX - rect.minX),
          height: Math.abs(rect.maxY - rect.minY),
          transform: [1, 0, 0, 1, rect.minX, rect.minY],
        };
      } else {
        const rect = selectedElements.getBbox()!;
        this.box = {
          width: rect.width,
          height: rect.height,
          transform: [1, 0, 0, 1, rect.x, rect.y],
        };
      }
    } else {
      this.box = null;
    }

    return this.box;
  }

  draw() {
    const bbox = this.box;
    if (!bbox) {
      return;
    }

    const ctx = this.editor.ctx;
    const stroke = this.editor.setting.get('guideBBoxStroke');

    ctx.save();
    ctx.strokeStyle = stroke;

    const polygon = rectToVertices(
      {
        x: 0,
        y: 0,
        width: bbox.width,
        height: bbox.height,
      },
      bbox.transform,
    ).map((pt) => this.editor.sceneCoordsToViewport(pt.x, pt.y));

    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  /** check if the point is in the selected box */
  hitTest(point: IPoint) {
    if (!this.box) {
      return false;
    }
    const TOL = 2;
    return isPointInRect(
      point,
      this.box,
      TOL / this.editor.zoomManager.getZoom(),
    );
  }

  setHover(hover: boolean) {
    if (this._hover === hover) {
      return;
    }
    this._hover = hover;
    this.eventEmitter.emit('hoverChange', hover);
  }

  setHoverByPoint(point: IPoint) {
    const hover = this.hitTest(point);
    this.setHover(hover);
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}
