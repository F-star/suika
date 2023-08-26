import { Editor } from '../editor';

export type ICursor =
  | 'default'
  | { type: 'resize'; rotation: number }
  // | { type: 'rotation'; rotation: number } // NO SUPPORT
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
  constructor(private editor: Editor) {}
  private cursor: ICursor = 'default';

  getCursor() {
    return this.cursor;
  }

  setCursor(cursor: ICursor) {
    // TODO: use custom cursor
    // const className = `suika-cursor-${cursor}`;
    // const prevClassName = `suika-cursor-${this.cursor}`;
    // this.editor.canvasElement.classList.remove(prevClassName);
    // this.editor.canvasElement.classList.add(className);
    let styleCursor = 'default';
    if (typeof cursor == 'string') {
      styleCursor = cursor;
    } else {
      if (cursor.type === 'resize') {
        // rotation: 0 ~ 180, 0 is for top, 90 is for right
        const rotation = cursor.rotation % 180;
        if (rotation < 22.5) {
          styleCursor = 'nesw-resize';
        } else if (rotation < 67.5) {
          styleCursor = 'ew-resize';
        } else if (rotation < 112.5) {
          styleCursor = 'ew-resize';
        } else if (rotation < 157.5) {
          styleCursor = 'nwse-resize';
        } else {
          styleCursor = 'ns-resize';
        }
      }
    }

    this.editor.canvasElement.style.cursor = styleCursor;
    this.cursor = cursor;
  }
}
