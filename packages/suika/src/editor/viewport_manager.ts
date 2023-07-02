import { IBox } from '../type';
import { getDevicePixelRatio } from '../utils/common';
import EventEmitter from '../utils/event_emitter';
import { Editor } from './editor';

interface Events {
  xOrYChange(x: number | undefined, y: number): void;
}

export class ViewportManager {
  private scrollX = 0;
  private scrollY = 0;
  private eventEmitter = new EventEmitter<Events>();

  constructor(private editor: Editor) {}
  getViewport(): IBox {
    return {
      x: this.scrollX,
      y: this.scrollY,
      width: parseFloat(this.editor.canvasElement.style.width),
      height: parseFloat(this.editor.canvasElement.style.height),
    };
  }
  setViewport({ x, y, width, height }: Partial<IBox>) {
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
  translate(dx: number, dy: number) {
    this.scrollX += dx;
    this.scrollY += dy;
    this.eventEmitter.emit('xOrYChange', this.scrollX, this.scrollY);
  }
  on(eventName: 'xOrYChange', handler: (x: number, y: number) => void) {
    this.eventEmitter.on(eventName, handler);
  }
  off(eventName: 'xOrYChange', handler: (x: number, y: number) => void) {
    this.eventEmitter.off(eventName, handler);
  }
}
