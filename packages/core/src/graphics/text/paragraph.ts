import { type IPoint, type IRect, Matrix } from '@suika/geo';
import svgPath from 'svgpath';

import { fontManager } from '../../font_manager';
import type { IGlyph, ILetterSpacing, ILineHeight, IPosition } from './type';
import {
  calcGlyphInfos,
  getDefaultLineHeightInFontUnit,
  getDefaultLineHeightPx,
} from './utils';

interface IParagraphAttrs {
  content: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: ILineHeight;
  letterSpacing: ILetterSpacing;
  maxWidth: number;
}

export class Paragraph {
  private attrs: IParagraphAttrs;
  private glyphs: IGlyph[][] = [];
  private width = 0;
  private lineHeightPx: number | undefined = undefined;

  constructor(attrs: IParagraphAttrs) {
    this.attrs = attrs;
    this.recomputeGlyphInfos();
  }

  getGlyphs() {
    if (this.glyphs) return this.glyphs;

    this.recomputeGlyphInfos();
    return this.glyphs;
  }

  private recomputeGlyphInfos() {
    this.width = 0;
    this.glyphs = [];

    const attrs = this.attrs;
    const lineHeightPx = this.getLineHeightPx();
    const lineHeightInFontUnit = this.pxToFontUnit(lineHeightPx);

    const lines = attrs.content.split('\n');
    let y = 0;
    let logicCount = 0;

    for (const line of lines) {
      const { glyphLines, logicCount: lineLogicCount } = calcGlyphInfos(line, {
        fontSize: attrs.fontSize,
        fontFamily: attrs.fontFamily,
        letterSpacing: attrs.letterSpacing,
        maxWidth: attrs.maxWidth,
        lineHeight: lineHeightInFontUnit,
      });
      for (const glyphs of glyphLines) {
        for (const glyph of glyphs) {
          glyph.position.y = y;
          glyph.logicIndex += logicCount;
        }
        y -= lineHeightInFontUnit;
        if (glyphs.length > 0) {
          const lastGlyph = glyphs.at(-1)!;
          this.width = Math.max(
            this.width,
            lastGlyph.position.x + lastGlyph.width,
          );
        }
        this.glyphs.push(glyphs);
      }
      logicCount += lineLogicCount;
    }
  }

  getLineHeightPx() {
    if (this.lineHeightPx !== undefined) {
      return this.lineHeightPx;
    }
    const attrs = this.attrs;
    const lineHeight = attrs.lineHeight;
    let lineHeightPx = lineHeight.value;
    if (lineHeight.units === 'RAW') {
      lineHeightPx = getDefaultLineHeightPx(attrs.fontFamily, attrs.fontSize);
    } else if (lineHeight.units === 'PERCENT') {
      lineHeightPx = attrs.fontSize * (lineHeight.value / 100);
    } else if (lineHeight.units === 'PIXELS') {
      lineHeightPx = lineHeight.value;
    }
    this.lineHeightPx = lineHeightPx;
    return lineHeightPx;
  }

  getLayoutSize() {
    const lineCount = this.glyphs.length;
    return {
      width: this.fontUnitToPx(this.width),
      // TODO: consider min line height
      height: lineCount * this.getLineHeightPx(),
    };
  }

  private fontUnitToPx(unit: number) {
    const font = fontManager.getFont(this.attrs.fontFamily);
    return unit * (this.attrs.fontSize / font.unitsPerEm);
  }

  getGlyphByIndex(index: number) {
    const glyphInfos = this.getGlyphs();

    // default value, not found return this
    const glyph: IGlyph = {
      position: { x: 0, y: 0 },
      width: 0,
      commands: '',
      logicIndex: 0,
    };

    let i = 0;
    for (const line of glyphInfos) {
      for (const glyph of line) {
        if (i === index) {
          return glyph;
        }
        i++;
      }
    }
    return glyph;
  }

  getPositionByPt(point: IPoint, lineIndex?: number): IPosition {
    const glyphs = this.getGlyphs();
    if (glyphs.length === 0) return { lineNum: 0, column: 0 };

    if (lineIndex === undefined) {
      const lineHeightInFontUnit = this.pxToFontUnit(this.getLineHeightPx());
      lineIndex = Math.floor(point.y / lineHeightInFontUnit);
    }
    if (lineIndex < 0) lineIndex = 0;
    if (lineIndex >= glyphs.length) lineIndex = glyphs.length - 1;

    const lineGlyphs = glyphs[lineIndex];
    // binary search, find the nearest but not greater than point.x glyph index
    let left = 0;
    let right = lineGlyphs.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const glyph = lineGlyphs[mid];
      if (point.x < glyph.position.x) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    // determine the column in the line
    let column = left;
    if (left === 0) {
      column = 0;
    } else if (left >= lineGlyphs.length) {
      column = lineGlyphs.length - 1;
    } else {
      // choose the glyph closer to the point
      if (
        lineGlyphs[left].position.x - point.x >
        point.x - lineGlyphs[right].position.x
      ) {
        column = right;
      } else {
        column = left;
      }
    }

    return { lineNum: lineIndex, column };
  }

  getGlyphIndexByPt(point: IPoint, lineIndex?: number) {
    const glyphs = this.getGlyphs();
    if (glyphs.length === 0) return 0;

    if (lineIndex === undefined) {
      const lineHeightInFontUnit = this.pxToFontUnit(this.getLineHeightPx());
      lineIndex = Math.floor(point.y / lineHeightInFontUnit);
    }
    if (lineIndex < 0) lineIndex = 0;
    if (lineIndex >= glyphs.length) lineIndex = glyphs.length - 1;

    const lineGlyphs = glyphs[lineIndex];

    // binary search, find the nearest but not greater than point.x glyph index
    let left = 0;
    let right = lineGlyphs.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const glyph = lineGlyphs[mid];
      if (point.x < glyph.position.x) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // determine the index in the line
    let glyphIndexInLine = left;
    if (left === 0) {
      glyphIndexInLine = 0;
    } else if (left >= lineGlyphs.length) {
      glyphIndexInLine = lineGlyphs.length - 1;
    } else {
      // choose the glyph closer to the point
      if (
        lineGlyphs[left].position.x - point.x >
        point.x - lineGlyphs[right].position.x
      ) {
        glyphIndexInLine = right;
      } else {
        glyphIndexInLine = left;
      }
    }

    // calculate the global index: the total number of glyphs in all previous lines + the index in the current line
    let totalIndex = 0;
    for (let i = 0; i < lineIndex; i++) {
      totalIndex += glyphs[i].length;
    }
    totalIndex += glyphIndexInLine;

    return totalIndex;
  }

  private pxToFontUnit(px: number) {
    const font = fontManager.getFont(this.attrs.fontFamily);
    return px * (font.unitsPerEm / this.attrs.fontSize);
  }

  getGlyphCount() {
    let count = 0;
    for (const line of this.glyphs) {
      count += line.length;
    }
    return count;
  }

  /**
   * get the rects of the glyphs in the range
   */
  getRangeRects(pos1: IPosition, pos2: IPosition) {
    let startPos = pos1;
    let endPos = pos2;
    if (
      pos1.lineNum > pos2.lineNum ||
      (pos1.lineNum === pos2.lineNum && pos1.column > pos2.column)
    ) {
      startPos = pos2;
      endPos = pos1;
    }

    const rects: IRect[] = [];
    const glyphs = this.getGlyphs();

    let rectHeight = 0;
    let rectOffsetY = 0;

    const lineHeightPx = this.getLineHeightPx();
    const defaultLineHeightInFontUnit = getDefaultLineHeightInFontUnit(
      this.attrs.fontFamily,
    );
    const lineHeightInFontUnit = this.pxToFontUnit(lineHeightPx);

    const isCollapsed =
      startPos.lineNum === endPos.lineNum && startPos.column === endPos.column;
    if (isCollapsed || lineHeightInFontUnit < defaultLineHeightInFontUnit) {
      rectHeight = defaultLineHeightInFontUnit;
      rectOffsetY = -(defaultLineHeightInFontUnit - lineHeightInFontUnit) / 2;
    } else {
      rectHeight = lineHeightInFontUnit;
    }

    const startLine = Math.max(startPos.lineNum, 0);
    const endLine = Math.min(endPos.lineNum, glyphs.length - 1);

    for (let lineIdx = startLine; lineIdx <= endLine; lineIdx++) {
      const line = glyphs[lineIdx];
      if (line.length === 0) continue;

      const lineLastCol = line.length - 1;

      let colStart: number;
      let colEnd: number;

      if (lineIdx === startPos.lineNum && lineIdx === endPos.lineNum) {
        colStart = startPos.column;
        colEnd = endPos.column;
      } else if (lineIdx === startPos.lineNum) {
        colStart = startPos.column;
        colEnd = lineLastCol;
      } else if (lineIdx === endPos.lineNum) {
        colStart = 0;
        colEnd = endPos.column;
      } else {
        colStart = 0;
        colEnd = lineLastCol;
      }

      colStart = Math.max(0, Math.min(colStart, lineLastCol));
      colEnd = Math.max(0, Math.min(colEnd, lineLastCol));

      const glyphStart = line[colStart];
      const x = glyphStart.position.x;
      const y = glyphStart.position.y;

      let x2 = 0;
      if (colEnd === lineLastCol && lineIdx !== endPos.lineNum) {
        x2 = this.width;
      } else {
        const glyphEnd = line[colEnd];
        x2 = glyphEnd.position.x;
      }

      rects.push({
        x: x,
        y: y + rectOffsetY,
        width: x2 - x,
        height: rectHeight,
      });
    }
    return rects;
  }

  getUnitToPxMatrix() {
    const font = fontManager.getFont(this.attrs.fontFamily);
    const fontSizeScale = this.attrs.fontSize / font.unitsPerEm;
    return new Matrix()
      .scale(fontSizeScale, -fontSizeScale)
      .translate(0, this.getLineHeightPx());
  }

  getUpGlyphIndex(index: number) {
    const glyph = this.getGlyphByIndex(index);

    const lineHeightInFontUnit = this.pxToFontUnit(this.getLineHeightPx());

    const lineIndex = Math.floor(-glyph.position.y / lineHeightInFontUnit) - 1;
    if (lineIndex < 0) return 0;

    const upIndex = this.getGlyphIndexByPt(glyph.position, lineIndex);
    return upIndex;
  }

  getDownGlyphIndex(index: number) {
    const glyph = this.getGlyphByIndex(index);

    const lineHeightInFontUnit = this.pxToFontUnit(this.getLineHeightPx());
    const lineIndex = Math.floor(-glyph.position.y / lineHeightInFontUnit) + 1;
    if (lineIndex >= this.glyphs.length) return this.getGlyphCount() - 1;

    const downIndex = this.getGlyphIndexByPt(
      {
        x: glyph.position.x,
        y: glyph.position.y + this.getLineHeightPx(),
      },
      lineIndex,
    );
    return downIndex;
  }

  getToPixelMatrix() {
    const font = fontManager.getFont(this.attrs.fontFamily);
    const fontSize = this.attrs.fontSize;
    const fontSizeScale = fontSize / font.unitsPerEm;

    const unitsPerEm = font.unitsPerEm;
    const ascender = font.ascender as number;
    const descender = font.descender as number;
    const lineGap = font.tables.hhea.lineGap as number;

    const defaultLineHeight = (ascender - descender + lineGap) * fontSizeScale;
    const actualLineHeight = this.getLineHeightPx();
    const halfPadding =
      (actualLineHeight - defaultLineHeight) / 2 / fontSizeScale;

    const matrix = new Matrix()
      .scale(1, -1)
      .translate(0, ascender + lineGap / 2 + halfPadding)
      .scale(fontSize / unitsPerEm, fontSize / unitsPerEm);

    return matrix;
  }

  getMergedPathString() {
    let d = '';
    const toPixelMatrix = this.getToPixelMatrix();
    const glyphs = this.getGlyphs();
    for (const line of glyphs) {
      for (const glyph of line) {
        if (!glyph.commands) continue;
        const transformedCmds = svgPath(glyph.commands)
          .translate(glyph.position.x, glyph.position.y)
          .toString();
        d += ' ' + transformedCmds;
      }
    }
    d = svgPath(d).matrix(toPixelMatrix.getArray()).toString();
    return d;
  }

  getOffsetAt(pos: IPosition): number {
    const glyphs = this.getGlyphs();
    const lineNum = Math.min(Math.max(pos.lineNum, 0), glyphs.length - 1);
    const line = glyphs[lineNum];

    if (line.length === 0) return 0;

    const column = Math.min(Math.max(pos.column, 0), line.length - 1);
    return line[column].logicIndex;
  }

  getPositionAt(
    offset: number,
    affinity: 'upstream' | 'downstream' = 'downstream',
  ): IPosition {
    const glyphs = this.getGlyphs();

    let isFound = false;
    const position: IPosition = { lineNum: 0, column: 0 };
    for (let lineNum = 0; lineNum < glyphs.length; lineNum++) {
      const line = glyphs[lineNum];
      for (let column = 0; column < line.length; column++) {
        if (line[column].logicIndex === offset) {
          position.lineNum = lineNum;
          position.column = column;
          isFound = true;
          break;
        }
      }
      if (isFound) break;
    }
    // if affinity is 'downstream' and the position is not the last line,
    // get the position of the next line
    if (affinity === 'downstream' && position.lineNum < glyphs.length - 1) {
      const nextLine = glyphs[position.lineNum + 1];
      if (nextLine.length > 0 && nextLine[0].logicIndex === offset) {
        position.lineNum = position.lineNum + 1;
        position.column = 0;
      }
    }
    return position;
  }

  getMaxPosition(): IPosition {
    return {
      lineNum: this.glyphs.length - 1,
      column: this.glyphs[this.glyphs.length - 1].length - 1,
    };
  }
}
