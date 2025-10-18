import type { IFontStyle, IGlyph } from '@suika/geo';

import { fontManager } from '../../font_manager';

export const calcGlyphInfos = (
  content: string,
  fontStyle: IFontStyle,
): IGlyph[] => {
  const font = fontManager.getFont(fontStyle.fontFamily);

  const originGlyphs = font.stringToGlyphs(content);
  const glyphs: IGlyph[] = [];

  let x = 0;
  const y = 0;
  for (const glyph of originGlyphs) {
    glyphs.push({
      position: { x: x, y: y },
      width: glyph.advanceWidth!, // TODO: when will it be empty?
      commands: glyph.path.toPathData(100),
    });
    x += glyph.advanceWidth!;
  }

  // 末尾换行符
  glyphs.push({
    position: { x: x, y: y },
    width: 0,
    commands: '',
  });

  return glyphs;
};

// export const calcTextSize_by_opentype = (
//   content: string,
//   fontStyle: IFontStyle,
// ): ITextMetrics => {
//   const font = fontManager.getFont(fontStyle.fontFamily);
//   const glyphs = calcGlyphInfos(content, fontStyle);
//   const lastGlyph = glyphs[glyphs.length - 1];
//   const contentMetrics = {
//     width:
//       ((lastGlyph.position.x + lastGlyph.width) * fontStyle.fontSize) /
//       font.unitsPerEm,
//     height: fontStyle.fontSize,
//   };
//   return contentMetrics;
// };
