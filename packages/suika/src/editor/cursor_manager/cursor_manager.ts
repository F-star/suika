import { Editor } from '../editor';
import './cursor.scss';

export type ICursor =
  | 'default'
  | { type: 'resize'; degree: number }
  // | { type: 'rotation'; degree: number } // NO SUPPORT
  | 'grab'
  | 'grabbing'
  | 'move'
  | 'pointer'
  | 'crosshair'
  | 'text'
  | 'wait'
  | 'help'
  | 'not-allowed'
  | 'zoom-in'
  | 'zoom-out';

export class CursorManger {
  private cursor!: ICursor;
  private clsPrefix = 'suika-cursor-';
  // the cursors with custom style, need to add class to canvas element
  private customCursor = new Set<ICursor>(['default']);

  constructor(private editor: Editor) {
    this.setCursor('default');
  }

  getCursor() {
    return this.cursor;
  }

  setCursor(cursor: ICursor) {
    // custom style
    if (this.customCursor.has(cursor)) {
      const className = `${this.clsPrefix}${cursor}`;
      const prevClassName = `${this.clsPrefix}${this.cursor}`;
      if (className !== prevClassName) {
        if (this.customCursor.has(this.cursor)) {
          this.editor.canvasElement.classList.remove(prevClassName);
        } else {
          this.editor.canvasElement.style.cursor = '';
        }

        this.editor.canvasElement.classList.add(className);
      }
    } else {
      let styleCursor = 'default';
      if (typeof cursor == 'string') {
        styleCursor = cursor;
      } else {
        if (cursor.type === 'resize') {
          // degree: 0 ~ 179. 0 is from top to bottom , 90 is from left to right
          const degree = cursor.degree % 180;
          if (degree < 22.5) {
            styleCursor = 'ns-resize';
          } else if (degree < 67.5) {
            styleCursor = 'nesw-resize';
          } else if (degree < 112.5) {
            styleCursor = 'ew-resize';
          } else if (degree < 157.5) {
            styleCursor = 'nwse-resize';
          } else {
            styleCursor = 'ns-resize';
          }
        }
      }
      this.editor.canvasElement.style.cursor = styleCursor;
    }

    this.cursor = cursor;
  }
}
