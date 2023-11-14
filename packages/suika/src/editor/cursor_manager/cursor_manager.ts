import { normalizeDegree } from '@suika/geo';
import { Editor } from '../editor';
import './cursor.scss';
import isEqual from 'lodash.isequal';
import { getRotationIconSvgDataUrl } from './util';

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
  private cursor: ICursor = 'default';
  // the cursors with custom style, need to add class to canvas element
  private customClassCursor = new Set<ICursor>(['default']);

  constructor(private editor: Editor) {
    this.setCursor('default');
  }

  getCursor() {
    return this.cursor;
  }

  private normalizeCursor(cursor: ICursor): ICursor {
    if (typeof cursor === 'string') {
      return cursor;
    }

    if (cursor.type === 'resize') {
      return {
        type: cursor.type,
        // degree: 0 ~ 179. e.g 0 is from top to bottom , 90 is from left to right
        degree: normalizeDegree(cursor.degree) % 180,
      };
    }

    if (cursor.type === 'rotation') {
      return {
        type: cursor.type,
        degree: normalizeDegree(Math.round(cursor.degree)),
      };
    }

    return cursor;
  }

  setCursor(cursor: ICursor) {
    cursor = this.normalizeCursor(cursor);
    if (isEqual(cursor, this.cursor)) {
      return;
    }

    this.cursor = cursor;

    // custom class cursor
    const clsPrefix = 'suika-cursor-';

    const canvasElement = this.editor.canvasElement;
    canvasElement.classList.forEach((className) => {
      if (className.startsWith(clsPrefix)) {
        canvasElement.classList.remove(className);
      }
    });
    this.editor.canvasElement.style.cursor = '';

    if (this.customClassCursor.has(cursor)) {
      const className = `${clsPrefix}${cursor}`;
      this.editor.canvasElement.classList.add(className);
    } else if (typeof cursor == 'string') {
      this.editor.canvasElement.style.cursor = cursor;
    } else if (cursor.type === 'resize') {
      this.setResizeCursorInCanvas(cursor.degree);
    } else if (cursor.type === 'rotation') {
      this.setRotationCursorInCanvas(cursor.degree);
    }
  }

  private setResizeCursorInCanvas(degree: number) {
    let styleCursor = '';
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
    this.editor.canvasElement.style.cursor = `url('${getRotationIconSvgDataUrl(
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
