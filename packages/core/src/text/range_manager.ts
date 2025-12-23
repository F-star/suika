import { type IRect, Matrix } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { type IDrawInfo, type SuikaText } from '../graphics';

export interface IRange {
  start: number;
  end: number;
}

export class RangeManager {
  private range: IRange = { start: 0, end: 0 };

  constructor(private editor: SuikaEditor) {}

  setRange(range: IRange) {
    this.range = {
      start: range.start,
      end: range.end,
    };
  }

  getRange() {
    return { ...this.range };
  }

  getSortedRange() {
    const rangeLeft = Math.min(this.range.start, this.range.end);
    const rangeRight = Math.max(this.range.start, this.range.end);
    return { rangeLeft, rangeRight };
  }

  moveLeft() {
    if (this.range.start === this.range.end) {
      this.dMove(-1);
    } else {
      const { rangeLeft } = this.getSortedRange();
      this.setRange({
        start: rangeLeft,
        end: rangeLeft,
      });
    }
  }

  getMaxRange() {
    const textGraphics = this.editor.textEditor.getTextGraphics();
    return textGraphics ? textGraphics.getContentLength() : Infinity;
  }

  moveRight() {
    if (this.range.start === this.range.end) {
      if (this.getMaxRange() > this.range.end) {
        this.dMove(1);
      }
    } else {
      const { rangeRight } = this.getSortedRange();
      this.setRange({
        start: rangeRight,
        end: rangeRight,
      });
    }
  }

  moveUp(rangeSelect: boolean) {
    const textGraphics = this.editor.textEditor.getTextGraphics();
    if (!textGraphics) return;
    const index = textGraphics.paragraph.getUpGlyphIndex(this.range.end);

    if (!rangeSelect) {
      this.setRange({
        start: index,
        end: index,
      });
    } else {
      this.setRange({
        start: this.range.start,
        end: index,
      });
    }
  }

  moveDown(rangeSelect: boolean) {
    const textGraphics = this.editor.textEditor.getTextGraphics();
    if (!textGraphics) return;
    const index = textGraphics.paragraph.getDownGlyphIndex(this.range.end);
    if (!rangeSelect) {
      this.setRange({
        start: index,
        end: index,
      });
    } else {
      this.setRange({
        start: this.range.start,
        end: index,
      });
    }
  }

  private dMove(num: number) {
    const start = Math.max(0, this.range.start + num);
    const end = Math.max(0, this.range.end + num);
    this.setRange({
      start,
      end,
    });
  }

  moveRangeEnd(delta: number) {
    const maxRange = this.getMaxRange();
    const end = this.range.end + delta;
    if (maxRange + 1 > end && end >= 0) {
      this.setRange({
        start: this.range.start,
        end,
      });
    }
  }

  setRangeEnd(end: number) {
    const delta = end - this.range.end;
    this.moveRangeEnd(delta);
  }

  // return the rects and matrix
  getCursorLinePos(textGraphics: SuikaText) {
    const unitToPxMatrix = textGraphics.paragraph.getUnitToPxMatrix();
    const textMatrix = new Matrix(...textGraphics.getWorldTransform());
    const viewportMatrix = this.editor.viewportManager.getViewMatrix();
    const matrix = viewportMatrix.append(textMatrix).append(unitToPxMatrix);

    const range = this.getRange();

    const rects = textGraphics.paragraph.getRangeRects(range.start, range.end);

    return {
      rects,
      matrix,
    };
  }

  draw(drawInfo: IDrawInfo, rects: IRect[], matrix: Matrix) {
    const range = this.getRange();
    const isDrawLine = range.start === range.end;

    const { ctx } = drawInfo;
    ctx.save();

    if (isDrawLine) {
      const p1 = matrix.apply({ x: rects[0].x, y: rects[0].y });
      const p2 = matrix.apply({
        x: rects[0].x,
        y: rects[0].y + rects[0].height,
      });
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();

      ctx.strokeStyle = this.editor.setting.get('textEditorCursorLineStroke');
      ctx.lineWidth = this.editor.setting.get('textEditorCursorSize');
      ctx.stroke();
    } else {
      ctx.transform(...matrix.getArray());
      ctx.fillStyle = this.editor.setting.get('textEditorSelectionFill');
      for (const rect of rects) {
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
    }

    ctx.restore();
  }
}
