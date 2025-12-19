import { type IGlyph, type IPoint, type IRect, Matrix } from '@suika/geo';

import { fontManager } from '../../font_manager';
import { calcGlyphInfos } from './utils';

interface IParagraphAttrs {
  content: string;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
}

export class Paragraph {
  private attrs: IParagraphAttrs;
  private glyphs: IGlyph[][] = [];
  private width = 0;

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

    const lines = this.attrs.content.split('\n');

    const lineHeight = this.attrs.lineHeight;
    const lineHeightInFontUnit = this.pxToFontUnit(lineHeight);

    let y = 0;
    for (const line of lines) {
      const glyphs = calcGlyphInfos(line, {
        fontSize: this.attrs.fontSize,
        fontFamily: this.attrs.fontFamily,
      });
      for (const glyph of glyphs) {
        glyph.position.y = y;
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
  }

  getLayoutSize() {
    const lineCount = this.glyphs.length;
    return {
      width: this.fontUnitToPx(this.width),
      height: lineCount * this.attrs.lineHeight,
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
      const lineHeightInFontUnit = this.pxToFontUnit(this.attrs.lineHeight);
      lineIndex = Math.floor(point.y / lineHeightInFontUnit);
    }
    if (lineIndex < 0) lineIndex = 0;
    if (lineIndex >= glyphs.length) lineIndex = glyphs.length - 1;

    const lineGlyphs = glyphs[lineIndex];
    if (lineGlyphs.length === 0) {
      let totalIndex = 0;
      for (let i = 0; i < lineIndex; i++) {
        totalIndex += glyphs[i].length;
      }
      return totalIndex;
    }

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
    const lineHeightInFontUnit = this.pxToFontUnit(this.attrs.lineHeight);
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
        y: y,
        width: x2 - x,
        height: lineHeightInFontUnit,
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
      .translate(0, this.attrs.lineHeight);
  }

  getUpGlyphIndex(index: number) {
    const glyph = this.getGlyphByIndex(index);

    const lineHeightInFontUnit = this.pxToFontUnit(this.attrs.lineHeight);

    const lineIndex = Math.floor(-glyph.position.y / lineHeightInFontUnit) - 1;
    if (lineIndex < 0) return 0;

    const upIndex = this.getGlyphIndexByPt(glyph.position, lineIndex);
    return upIndex;
  }

  getDownGlyphIndex(index: number) {
    const glyph = this.getGlyphByIndex(index);

    const lineHeightInFontUnit = this.pxToFontUnit(this.attrs.lineHeight);
    const lineIndex = Math.floor(-glyph.position.y / lineHeightInFontUnit) + 1;
    if (lineIndex >= this.glyphs.length) return this.getGlyphCount() - 1;

    const downIndex = this.getGlyphIndexByPt(
      {
        x: glyph.position.x,
        y: glyph.position.y + this.attrs.lineHeight,
      },
      lineIndex,
    );
    return downIndex;
  }
}
