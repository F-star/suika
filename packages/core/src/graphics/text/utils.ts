import { fontManager } from '../../font_manager';
import { type IFontStyle, type IGlyph } from './type';

export const calcGlyphInfos = (content: string, fontStyle: IFontStyle) => {
  const font = fontManager.getFont(fontStyle.fontFamily);

  const originGlyphs = font.stringToGlyphs(content);
  let glyphs: IGlyph[] = [];
  const glyphLines: IGlyph[][] = [];

  let letterSpacingVal = fontStyle.letterSpacing.value;
  if (fontStyle.letterSpacing.units === 'PIXELS') {
    letterSpacingVal = pxToFontUnit(letterSpacingVal, fontStyle);
  } else if (fontStyle.letterSpacing.units === 'PERCENT') {
    letterSpacingVal = pxToFontUnit(
      (fontStyle.fontSize * letterSpacingVal) / 100,
      fontStyle,
    );
  }
  const maxWidth = pxToFontUnit(fontStyle.maxWidth, fontStyle);

  let x = 0;
  const y = 0;
  let i = 0;

  for (; i < originGlyphs.length; i++) {
    const glyph = originGlyphs[i];
    let width = glyph.advanceWidth ?? 0;

    // 当前行超过最大宽度了，自动换行
    if (x > maxWidth) {
      glyphs.push({
        position: { x, y: y },
        width: 0,
        commands: '',
        logicIndex: i - 1,
      });

      x = 0;
      // TODO: 这里大概要塞一个换行符进去
      glyphLines.push(glyphs);
      glyphs = [];
    }

    // solve kerning
    if (i > 0) {
      const prevGlyph = originGlyphs[i - 1];
      const kerningValue = font.getKerningValue(prevGlyph, glyph);
      if (kerningValue) {
        x += kerningValue;
      }
    }

    // last glyph don't add letter spacing
    if (i < originGlyphs.length - 1) {
      width += letterSpacingVal;
    }

    glyphs.push({
      position: { x: x, y: y },
      width: width,
      commands: glyph.path.toPathData(100),
      logicIndex: i,
    });
    x += width;
  }

  // 末尾换行符
  glyphs.push({
    position: { x, y: y },
    width: 0,
    commands: '',
    logicIndex: i,
  });

  glyphLines.push(glyphs);

  return {
    glyphLines,
    logicCount: i + 1,
  };
};

const pxToFontUnit = (
  px: number,
  fontStyle: { fontFamily: string; fontSize: number },
) => {
  const font = fontManager.getFont(fontStyle.fontFamily);
  return px * (font.unitsPerEm / fontStyle.fontSize);
};

const fontUnitToPx = (unitsPerEm: number, unit: number, fontSize: number) => {
  return unit * (fontSize / unitsPerEm);
};

export const getDefaultLineHeightPx = (
  fontFamily: string,
  fontSize: number,
) => {
  const font = fontManager.getFont(fontFamily);
  if (!font) return 0;
  const ascender = font.tables.hhea.ascender as number;
  const descender = font.tables.hhea.descender as number;
  const lineGap = font.tables.hhea.lineGap as number;
  return fontUnitToPx(
    font.unitsPerEm,
    ascender - descender + lineGap,
    fontSize,
  );
};

export const getDefaultLineHeightInFontUnit = (fontFamily: string) => {
  const font = fontManager.getFont(fontFamily);
  if (!font) return 0;
  const ascender = font.tables.hhea.ascender as number;
  const descender = font.tables.hhea.descender as number;
  const lineGap = font.tables.hhea.lineGap as number;
  return ascender - descender + lineGap;
};
