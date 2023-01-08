import { IBox } from '../type.interface';
import { Editor } from './editor';

export class ViewportManager {
  // private current!: IBox;
  private scrollX = 0;
  private scrollY = 0;

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
  }
  translate(dx: number, dy: number) {
    this.scrollX += dx;
    this.scrollY += dy;
  }
}
