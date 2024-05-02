import './cursor.css';

import { isEqual } from '@suika/common';
import { normalizeDegree } from '@suika/geo';

import { type Editor } from '../editor';
import { getIconSvgDataUrl } from './util';

export interface ICursorRotation {
  type: 'rotation';
  degree: number;
}

interface ICursorResize {
  type: 'resize';
  degree: number;
}

export type ICursor =
  | 'default'
  | ICursorResize
  | ICursorRotation
  | 'grab'
  | 'grabbing'
  | 'move'
  | 'pointer'
  | 'crosshair'
  | 'text'
  | 'pen'
  | 'pen-close';

export class CursorManger {
  private cursor!: ICursor;
  // the cursors with custom style, need to add class to canvas element
  private customClassCursor = new Set<ICursor>([
    'default',
    'move',
    'pen',
    'pen-close',
    'crosshair',
  ]);

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
    } else if (cursor.type === 'resize' || cursor.type === 'rotation') {
      this.editor.canvasElement.style.cursor = getIconSvgDataUrl(
        cursor.type,
        cursor.degree,
      );
    }
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
