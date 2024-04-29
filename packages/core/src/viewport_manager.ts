import { EventEmitter, getDevicePixelRatio } from '@suika/common';
import { type IBox, type IRect } from '@suika/geo';

import { type Editor } from './editor';

interface Events {
  sizeChange(width: number, height: number): void;
  xOrYChange(x: number, y: number): void;
}

export class ViewportManager {
  private x = 0;
  private y = 0;
  // private width = 100;
  // private height = 100;
  private eventEmitter = new EventEmitter<Events>();

  constructor(private editor: Editor) {}
  getViewport(): IRect {
    return {
      x: this.x,
      y: this.y,
      // width: this.width,
      width: parseFloat(this.editor.canvasElement.style.width),
      // height: this.height,
      height: parseFloat(this.editor.canvasElement.style.height),
    };
  }
  setViewport({ x, y, width, height }: Partial<IRect>) {
    // const prevX = this.x;
    // const prevY = this.y;
    const prevViewport = this.getViewport();
    const dpr = getDevicePixelRatio();

    x ??= prevViewport.x;
    y ??= prevViewport.y;
    width ??= prevViewport.width;
    height ??= prevViewport.height;
    if (x !== undefined) {
      this.x = x;
    }
    if (y !== undefined) {
      this.y = y;
    }
    if (width !== undefined) {
      // this.width = width;
      this.editor.canvasElement.width = width * dpr;
      this.editor.canvasElement.style.width = width + 'px';
    }
    if (height !== undefined) {
      // this.height = height;
      this.editor.canvasElement.height = height * dpr;
      this.editor.canvasElement.style.height = height + 'px';
    }

    if (prevViewport.width !== width || prevViewport.height !== height) {
      this.eventEmitter.emit('sizeChange', width, height);
    }
    if (prevViewport.x !== x || prevViewport.y !== y) {
      this.eventEmitter.emit('xOrYChange', x, y);
    }
  }
  getCenter() {
    const { x, y, width, height } = this.getViewport();
    const zoom = this.editor.zoomManager.getZoom();
    return {
      x: x + width / 2 / zoom,
      y: y + height / 2 / zoom,
    };
  }
  translate(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    this.eventEmitter.emit('xOrYChange', this.x, this.y);
  }
  getBbox(): IBox {
    const { x, y, width, height } = this.getViewport();
    const zoom = this.editor.zoomManager.getZoom();
    return {
      minX: x,
      minY: y,
      maxX: x + width / zoom,
      maxY: y + height / zoom,
    };
  }
  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}
