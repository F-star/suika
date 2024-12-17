import { EventEmitter, getDevicePixelRatio } from '@suika/common';
import { type IBox, type IRect } from '@suika/geo';

import { type SuikaEditor } from './editor';

interface Events {
  xOrYChange(x: number | undefined, y: number): void;
}

export class ViewportManager {
  private scrollX = 0;
  private scrollY = 0;
  private eventEmitter = new EventEmitter<Events>();

  constructor(private editor: SuikaEditor) {}
  getViewport(): IRect {
    return {
      x: this.scrollX,
      y: this.scrollY,
      width: parseFloat(this.editor.canvasElement.style.width),
      height: parseFloat(this.editor.canvasElement.style.height),
    };
  }
  setViewport({ x, y, width, height }: Partial<IRect>) {
    const prevX = this.scrollX;
    const prevY = this.scrollY;
    const dpr = getDevicePixelRatio();
    if (x !== undefined) {
      this.scrollX = x;
    }
    if (y !== undefined) {
      this.scrollY = y;
    }
    if (width !== undefined) {
      this.editor.canvasElement.width = width * dpr;
      this.editor.canvasElement.style.width = width + 'px';
    }
    if (height !== undefined) {
      this.editor.canvasElement.height = height * dpr;
      this.editor.canvasElement.style.height = height + 'px';
    }

    if (prevX !== x || prevY !== y) {
      this.eventEmitter.emit('xOrYChange', x as number, y as number);
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
    this.scrollX += dx;
    this.scrollY += dy;
    this.eventEmitter.emit('xOrYChange', this.scrollX, this.scrollY);
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
