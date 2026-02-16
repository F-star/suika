import { type IRect, Matrix } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { type IDrawInfo, type SuikaText } from '../graphics';

export interface IRange {
  start: number;
  end: number;
}

export interface ISelection {
  focusColumn: number;
  focusLineNum: number;
  anchorColumn: number;
  anchorLineNum: number;
}

export interface IRange2 {
  endColumn: number;
  endLineNum: number;
  startColumn: number;
  startLineNum: number;
}

export class SelectionManager {
  private selection: ISelection = {
    focusColumn: 0,
    focusLineNum: 0,
    anchorColumn: 0,
    anchorLineNum: 0,
  };

  constructor(private editor: SuikaEditor) {}

  setSelection(selection: Partial<ISelection>) {
    this.selection = { ...this.selection, ...selection };
  }

  getSelection() {
    return { ...this.selection };
  }

  isCollapsed() {
    const { anchorLineNum, anchorColumn, focusLineNum, focusColumn } =
      this.selection;

    return anchorLineNum === focusLineNum && anchorColumn === focusColumn;
  }

  getSortedSelectionRange(): IRange2 {
    const { anchorLineNum, anchorColumn, focusLineNum, focusColumn } =
      this.selection;

    const isAnchorBefore =
      anchorLineNum < focusLineNum ||
      (anchorLineNum === focusLineNum && anchorColumn <= focusColumn);

    if (isAnchorBefore) {
      return {
        startLineNum: anchorLineNum,
        startColumn: anchorColumn,
        endLineNum: focusLineNum,
        endColumn: focusColumn,
      };
    } else {
      return {
        startLineNum: focusLineNum,
        startColumn: focusColumn,
        endLineNum: anchorLineNum,
        endColumn: anchorColumn,
      };
    }
  }

  getStartPosition() {
    const { startColumn, startLineNum } = this.getSortedSelectionRange();
    return {
      column: startColumn,
      lineNum: startLineNum,
    };
  }

  getEndPosition() {
    const { endColumn, endLineNum } = this.getSortedSelectionRange();
    return {
      column: endColumn,
      lineNum: endLineNum,
    };
  }

  getMaxRange() {
    const textGraphics = this.editor.textEditor.getTextGraphics();
    return textGraphics ? textGraphics.getContentLength() : Infinity;
  }

  moveLeft(rangeSelect: boolean) {
    const textGraphics = this.editor.textEditor.getTextGraphics();
    if (!textGraphics) return;

    if (!rangeSelect && !this.isCollapsed()) {
      const { startColumn, startLineNum } = this.getSortedSelectionRange();
      this.setSelection({
        anchorColumn: startColumn,
        anchorLineNum: startLineNum,
        focusColumn: startColumn,
        focusLineNum: startLineNum,
      });
    } else {
      const { focusColumn, focusLineNum } = this.selection;
      if (focusColumn === 0 && focusLineNum === 0) {
        return;
      }
      const offset = textGraphics.paragraph.getOffsetAt({
        lineNum: focusLineNum,
        column: focusColumn,
      });
      const newPosition = textGraphics.paragraph.getPositionAt(offset - 1);
      this.setSelection({
        // if rangeSelect is true, anchor does not change
        ...(rangeSelect
          ? {}
          : {
              anchorColumn: newPosition.column,
              anchorLineNum: newPosition.lineNum,
            }),
        focusColumn: newPosition.column,
        focusLineNum: newPosition.lineNum,
      });
    }
  }

  moveRight(rangeSelect: boolean) {
    const textGraphics = this.editor.textEditor.getTextGraphics();
    if (!textGraphics) return;

    if (!rangeSelect && !this.isCollapsed()) {
      const { endColumn, endLineNum } = this.getSortedSelectionRange();
      this.setSelection({
        anchorColumn: endColumn,
        anchorLineNum: endLineNum,
        focusColumn: endColumn,
        focusLineNum: endLineNum,
      });
    } else {
      const { focusColumn, focusLineNum } = this.selection;
      const maxPosition = textGraphics.paragraph.getMaxPosition();
      if (
        focusLineNum === maxPosition.lineNum &&
        focusColumn === maxPosition.column
      ) {
        return;
      }

      const offset = textGraphics.paragraph.getOffsetAt({
        lineNum: focusLineNum,
        column: focusColumn,
      });
      const newPosition = textGraphics.paragraph.getPositionAt(offset + 1);

      this.setSelection({
        // if rangeSelect is true, anchor does not change
        ...(rangeSelect
          ? {}
          : {
              anchorColumn: newPosition.column,
              anchorLineNum: newPosition.lineNum,
            }),
        focusColumn: newPosition.column,
        focusLineNum: newPosition.lineNum,
      });
    }
  }

  moveUp(rangeSelect: boolean) {
    const textGraphics = this.editor.textEditor.getTextGraphics();
    if (!textGraphics) return;

    const glyphs = textGraphics.paragraph.getGlyphs();

    // 非范围选择且有选区时，以选区起始位置为参考点；否则以 focus 为参考点
    // If rangeSelect is false and the selection is not collapsed,
    // use the start position of the selection as the reference point;
    // otherwise, use the focus position as the reference point.
    let refLineNum: number;
    let refColumn: number;
    if (!rangeSelect && !this.isCollapsed()) {
      const { startLineNum, startColumn } = this.getSortedSelectionRange();
      refLineNum = startLineNum;
      refColumn = startColumn;
    } else {
      refLineNum = this.selection.focusLineNum;
      refColumn = this.selection.focusColumn;
    }

    if (refLineNum <= 0) {
      this.setSelection({
        ...(rangeSelect ? {} : { anchorColumn: 0, anchorLineNum: 0 }),
        focusColumn: 0,
        focusLineNum: 0,
      });
      return;
    }

    const glyph = glyphs[refLineNum][refColumn];
    const upPos = textGraphics.paragraph.getPositionByPt(
      glyph.position,
      refLineNum - 1,
    );

    this.setSelection({
      ...(rangeSelect
        ? {}
        : {
            anchorColumn: upPos.column,
            anchorLineNum: upPos.lineNum,
          }),
      focusColumn: upPos.column,
      focusLineNum: upPos.lineNum,
    });
  }

  moveDown(rangeSelect: boolean) {
    const textGraphics = this.editor.textEditor.getTextGraphics();
    if (!textGraphics) return;

    const glyphs = textGraphics.paragraph.getGlyphs();

    // 非范围选择且有选区时，以选区结束位置为参考点；否则以 focus 为参考点
    // If rangeSelect is false and the selection is not collapsed,
    // use the end position of the selection as the reference point;
    // otherwise, use the focus position as the reference point.
    let refLineNum: number;
    let refColumn: number;
    if (!rangeSelect && !this.isCollapsed()) {
      const { endLineNum, endColumn } = this.getSortedSelectionRange();
      refLineNum = endLineNum;
      refColumn = endColumn;
    } else {
      refLineNum = this.selection.focusLineNum;
      refColumn = this.selection.focusColumn;
    }

    const maxPos = textGraphics.paragraph.getMaxPosition();
    if (refLineNum >= maxPos.lineNum) {
      this.setSelection({
        ...(rangeSelect
          ? {}
          : { anchorColumn: maxPos.column, anchorLineNum: maxPos.lineNum }),
        focusColumn: maxPos.column,
        focusLineNum: maxPos.lineNum,
      });
      return;
    }

    const glyph = glyphs[refLineNum][refColumn];
    const downPos = textGraphics.paragraph.getPositionByPt(
      glyph.position,
      refLineNum + 1,
    );

    this.setSelection({
      ...(rangeSelect
        ? {}
        : {
            anchorColumn: downPos.column,
            anchorLineNum: downPos.lineNum,
          }),
      focusColumn: downPos.column,
      focusLineNum: downPos.lineNum,
    });
  }

  // return the rects and matrix
  getCursorLinePos(textGraphics: SuikaText) {
    const unitToPxMatrix = textGraphics.paragraph.getUnitToPxMatrix();
    const textMatrix = new Matrix(...textGraphics.getWorldTransform());
    const viewportMatrix = this.editor.viewportManager.getViewMatrix();
    const matrix = viewportMatrix.append(textMatrix).append(unitToPxMatrix);

    const selection = this.getSelection();

    const rects = textGraphics.paragraph.getRangeRects(
      {
        lineNum: selection.anchorLineNum,
        column: selection.anchorColumn,
      },
      {
        lineNum: selection.focusLineNum,
        column: selection.focusColumn,
      },
    );

    return {
      rects,
      matrix,
    };
  }

  draw(drawInfo: IDrawInfo, rects: IRect[], matrix: Matrix) {
    // const range = this.getRange();
    // const isDrawLine = range.start === range.end;
    const { ctx } = drawInfo;
    ctx.save();

    if (this.isCollapsed()) {
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
