import { normalizeDegree } from '@suika/geo';
import { Editor } from '../editor';
import './cursor.scss';
import isEqual from 'lodash.isequal';
import { getRotationIconSvgBase64 } from './util';

export interface ICursorRotation {
  type: 'rotation';
  degree: number;
}

export type ICursor =
  | 'default'
  | { type: 'resize'; degree: number }
  | ICursorRotation
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
  // the cursors with custom style, need to add class to canvas element
  private customCursor = new Set<ICursor>(['default']);

  constructor(private editor: Editor) {
    this.setCursor('default');
  }

  getCursor() {
    return this.cursor;
  }

  setCursor(cursor: ICursor) {
    if (isEqual(cursor, this.cursor)) {
      return;
    }
    const prevCursor = this.cursor;
    this.cursor = cursor;

    // custom class cursor
    const clsPrefix = 'suika-cursor-';
    const className = `${clsPrefix}${cursor}`;
    const prevClassName = `${clsPrefix}${prevCursor}`;
    if (className !== prevClassName) {
      if (this.customCursor.has(prevCursor)) {
        this.editor.canvasElement.classList.remove(prevClassName);
      } else {
        this.editor.canvasElement.style.cursor = '';
      }
    }

    if (this.customCursor.has(cursor)) {
      const prevClassName = `${clsPrefix}${prevCursor}`;
      if (className !== prevClassName) {
        this.editor.canvasElement.classList.add(className);
      }
    } else {
      if (typeof cursor == 'string') {
        this.editor.canvasElement.style.cursor = cursor;
      } else if (cursor.type === 'resize') {
        this.setResizeCursorInCanvas(cursor.degree);
      } else if (cursor.type === 'rotation') {
        this.setRotationCursorInCanvas(cursor.degree);
      }
    }
  }

  private setResizeCursorInCanvas(degree: number) {
    let styleCursor = '';
    // degree: 0 ~ 179. 0 is from top to bottom , 90 is from left to right
    degree = normalizeDegree(degree) % 180;
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
    this.editor.canvasElement.style.cursor = styleCursor;
  }

  private setRotationCursorInCanvas(degree: number) {
    degree = Math.round(degree);
    // TODO: cache the svg base64
    this.editor.canvasElement.style.cursor = `url('${getRotationIconSvgBase64(
      degree,
    )}') 16 16, auto`;
  }
}

export const isRotationCursor = (
  cursor: ICursor,
): cursor is ICursorRotation => {
  return (
    typeof cursor === 'object' &&
    (cursor as ICursorRotation)?.type === 'rotation'
  );
};
