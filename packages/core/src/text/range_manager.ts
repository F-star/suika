import { applyMatrix, type IPoint, Matrix } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { fontManager } from '../font_manager';
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

  dMove(num: number) {
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

  private getGlyphByIndex(textGraphics: SuikaText, index: number) {
    const glyphInfos = textGraphics.getGlyphs();
    const { height: contentHeight } = textGraphics.getContentMetrics();
    const glyphInfo = glyphInfos[index] ?? {
      position: { x: 0, y: 0 },
      width: 0,
      height: contentHeight,
    };

    const font = fontManager.getFont(textGraphics.attrs.fontFamily);
    const fontSizeScale = textGraphics.attrs.fontSize / font.unitsPerEm;
    const fontSizeTf = new Matrix().scale(fontSizeScale, fontSizeScale);
    const position = fontSizeTf.apply(glyphInfo.position);

    return {
      ...glyphInfo,
      position,
    };
  }

  getCursorLinePos(textGraphics: SuikaText) {
    const range = this.getRange();
    const { height: contentHeight } = textGraphics.getContentMetrics();
    const startGlyphInfo = this.getGlyphByIndex(textGraphics, range.start);
    const cursorPosInText = startGlyphInfo.position;

    const textMatrix = textGraphics.getWorldTransform();

    const top = applyMatrix(textMatrix, cursorPosInText);
    const topInViewport = this.editor.toViewportPt(top.x, top.y);

    const bottom = applyMatrix(textMatrix, {
      x: cursorPosInText.x,
      y: cursorPosInText.y + contentHeight,
    });
    const bottomInViewport = this.editor.toViewportPt(bottom.x, bottom.y);

    let rightInViewport: IPoint | null = null;

    if (range.end !== range.start) {
      const endGlyphInfo = this.getGlyphByIndex(textGraphics, range.end);
      const endPosInText = endGlyphInfo.position;
      const right = applyMatrix(textMatrix, endPosInText);
      rightInViewport = this.editor.toViewportPt(right.x, right.y);
    }

    return {
      topInViewport,
      bottomInViewport,
      rightInViewport,
    };
  }

  draw(
    drawInfo: IDrawInfo,
    topInViewport: IPoint,
    bottomInViewport: IPoint,
    rightInViewport: IPoint | null,
  ) {
    const { ctx } = drawInfo;

    const stroke = this.editor.setting.get('textEditorCursorLineStroke');
    const strokeWidth = this.editor.setting.get('textEditorCursorSize');

    ctx.save();
    if (!rightInViewport) {
      ctx.beginPath();
      ctx.moveTo(topInViewport.x, topInViewport.y);
      ctx.lineTo(bottomInViewport.x, bottomInViewport.y);
      ctx.closePath();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    } else {
      const fill = this.editor.setting.get('textEditorSelectionFill');
      ctx.beginPath();
      ctx.moveTo(topInViewport.x, topInViewport.y);
      ctx.lineTo(bottomInViewport.x, bottomInViewport.y);
      const dx = bottomInViewport.x - topInViewport.x;
      const dy = bottomInViewport.y - topInViewport.y;
      const rightBottom = {
        x: rightInViewport.x + dx,
        y: rightInViewport.y + dy,
      };
      ctx.lineTo(rightBottom.x, rightBottom.y);
      ctx.lineTo(rightInViewport.x, rightInViewport.y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    ctx.restore();
  }
}
