import { fontManager } from '../../font_manager';
import { type IFontStyle, type IGlyph } from './type';

export const calcGlyphInfos = (
  content: string,
  fontStyle: IFontStyle,
): IGlyph[] => {
  const font = fontManager.getFont(fontStyle.fontFamily);

  const originGlyphs = font.stringToGlyphs(content);
  const glyphs: IGlyph[] = [];

  let letterSpacingVal = fontStyle.letterSpacing.value;
  if (fontStyle.letterSpacing.units === 'PIXELS') {
    letterSpacingVal = pxToFontUnit(letterSpacingVal, fontStyle);
  } else if (fontStyle.letterSpacing.units === 'PERCENT') {
    letterSpacingVal = pxToFontUnit(
      (fontStyle.fontSize * letterSpacingVal) / 100,
      fontStyle,
    );
  }

  let x = 0;
  const y = 0;

  for (let i = 0; i < originGlyphs.length; i++) {
    const glyph = originGlyphs[i];
    let width = glyph.advanceWidth ?? 0;

    // last glyph don't add letter spacing
    if (i < originGlyphs.length - 1) {
      width += letterSpacingVal;
    }

    glyphs.push({
      position: { x: x, y: y },
      width: width,
      commands: glyph.path.toPathData(100),
    });
    x += width;
  }

  // 末尾换行符
  glyphs.push({
    position: { x, y },
    width: 0,
    commands: '',
  });

  return glyphs;
};

const pxToFontUnit = (
  px: number,
  fontStyle: { fontFamily: string; fontSize: number },
) => {
  const font = fontManager.getFont(fontStyle.fontFamily);
  return px * (font.unitsPerEm / fontStyle.fontSize);
};
