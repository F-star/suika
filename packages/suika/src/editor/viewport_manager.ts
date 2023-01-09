import { IBox } from '../type.interface';
import EventEmitter from '../utils/event_emitter';
import { Editor } from './editor';

export class ViewportManager {
  private scrollX = 0;
  private scrollY = 0;
  private eventEmitter = new EventEmitter();

  constructor(private editor: Editor) {}
  getViewport(): IBox {
    return {
      x: this.scrollX,
      y: this.scrollY,
      width: this.editor.canvasElement.width,
      height: this.editor.canvasElement.height,
    };
  }
  setViewport({ x, y, width, height }: Partial<IBox>) {
    const prevX = this.scrollX;
    const prevY = this.scrollY;
    if (x !== undefined) {
      this.scrollX = x;
    }
    if (y !== undefined) {
      this.scrollY = y;
    }
    if (width !== undefined) {
      this.editor.canvasElement.width = width;
    }
    if (height !== undefined) {
      this.editor.canvasElement.height = height;
    }

    if (prevX !== x || prevY !== y) {
      this.eventEmitter.emit('xOrYChange', x, y);
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
