import { sliceContent } from '@suika/common';
import { type IPoint, type IRect, Matrix } from '@suika/geo';
import svgPath from 'svgpath';

import { fontManager } from '../../font_manager';
import { type IGlyph, type ILetterSpacing, type ILineHeight } from './type';
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
   *
   * [start, end)
   * if start === end, return the glyph at start
   */
  getRangeRects(start: number, end: number) {
    if (start > end) {
      [start, end] = [end, start];
    }
    const rects: IRect[] = [];

    const glyphs = this.getGlyphs();
    let i = 0;

    let rectHeight = 0;
    let rectOffsetY = 0;

    const lineHeightPx = this.getLineHeightPx();
    const defaultLineHeightInFontUnit = getDefaultLineHeightInFontUnit(
      this.attrs.fontFamily,
    );
    const lineHeightInFontUnit = this.pxToFontUnit(lineHeightPx);

    const isDrawLine = start === end;
    if (isDrawLine || lineHeightInFontUnit < defaultLineHeightInFontUnit) {
      rectHeight = defaultLineHeightInFontUnit;
      rectOffsetY = -(defaultLineHeightInFontUnit - lineHeightInFontUnit) / 2;
    } else {
      rectHeight = lineHeightInFontUnit;
    }

    for (const line of glyphs) {
      const lineStart = i;
      const lineEnd = lineStart + line.length - 1; // ignore last glyph '\n'

      if (lineEnd < start) {
        i += line.length;
        continue;
      }
      if (lineStart > end) {
        break;
      }

      const a = Math.max(start, lineStart);
      const b = Math.min(end, lineEnd);

      const glyphStart = line[a - lineStart];
      const x = glyphStart.position.x;
      const y = glyphStart.position.y;

      let x2 = 0;
      if (b === lineEnd && lineEnd !== end) {
        x2 = this.width;
      } else {
        const glyphEnd = line[b - lineStart];
        x2 = glyphEnd.position.x;
      }

      rects.push({
        x: x,
        y: y + rectOffsetY,
        width: x2 - x,
        height: rectHeight,
      });

      i += line.length;
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

  glyphIndexToLogicIndex(index: number) {
    const glyphs = this.getGlyphs().flat();
    const glyph = glyphs[index];

    if (!glyph) return -1;
    return glyph.logicIndex;
  }

  sliceContentByGlyphIndex(start: number, end?: number) {
    const startGlyph = this.getGlyphByIndex(start);
    const endGlyph = end === undefined ? undefined : this.getGlyphByIndex(end);

    return sliceContent(
      this.attrs.content,
      startGlyph.logicIndex,
      endGlyph?.logicIndex,
    );
  }

  // [startLogic, endLogic)
  getGlyphBetweenCountByLogicIndex(startLogic: number, endLogic: number) {
    const glyphs = this.getGlyphs().flat();
    const start = glyphs.findIndex((item) => item.logicIndex === startLogic);
    if (start === -1) {
      console.warn('start glyph not found');
    }
    let end = -1;
    for (let i = glyphs.length - 1; i >= 0; i--) {
      if (glyphs[i].logicIndex === endLogic) {
        end = i;
        break;
      }
    }
    if (end === -1) {
      console.warn('end glyph not found');
    }

    return end - start;
  }
}
