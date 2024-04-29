import { EventEmitter } from '@suika/common';
import {
  type IPoint,
  isPointInRect,
  type ITransformRect,
  rectToVertices,
} from '@suika/geo';
import { Graphics } from 'pixi.js';

import { type Editor } from './editor';

interface Events {
  hoverChange(isHover: boolean): void;
}

export class SelectedBox {
  private graphics: Graphics = new Graphics();
  private box: ITransformRect | null = null;
  private eventEmitter = new EventEmitter<Events>();
  private _hover = false;

  constructor(private editor: Editor) {
    this.bindEvent();
  }

  getGraphics() {
    return this.graphics;
  }

  isHover() {
    return this._hover;
  }

  getBox(): ITransformRect | null {
    return this.box ? { ...this.box } : null;
  }

  updateBox() {
    const selectedElements = this.editor.selectedElements;

    const count = selectedElements.size();
    if (count > 0) {
      if (count === 1) {
        const selectedGraph = selectedElements.getItems()[0];
        const rect = selectedGraph.getSize();
        this.box = {
          width: rect.width,
          height: rect.height,
          transform: selectedGraph.attrs.transform!,
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

  private bindEvent() {
    this.editor.selectedElements.on('itemsChange', this.updateBoxAndDraw);
    this.editor.viewportManager.on('xOrYChange', this.updateBoxAndDraw);
  }

  private unbindEvent() {
    this.editor.selectedElements.off('itemsChange', this.updateBoxAndDraw);
    this.editor.viewportManager.off('xOrYChange', this.updateBoxAndDraw);
  }

  clear() {
    this.graphics.clear();
  }

  visible(val: boolean) {
    this.graphics.visible = val;
  }

  updateBoxAndDraw = () => {
    this.updateBox();
    this.graphics.clear();

    // 绘制选中框
    const bbox = this.box;
    if (!bbox) {
      return;
    }

    const polygon = rectToVertices(
      {
        x: 0,
        y: 0,
        width: bbox.width,
        height: bbox.height,
      },
      bbox.transform,
    ).map((pt) => this.editor.sceneCoordsToViewport(pt.x, pt.y));
    this.graphics.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
      this.graphics.lineTo(polygon[i].x, polygon[i].y);
    }
    this.graphics.closePath();
    this.graphics.stroke({
      color: this.editor.setting.get('selectedBoxStroke'),
      width: this.editor.setting.get('selectedBoxStrokeWidth'),
    });
  };

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

  destroy() {
    this.unbindEvent();
  }
}
