import { type IPoint } from '../type';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
ctx.fontKerning = 'none'; // no kerning

export interface ITextMetrics {
  width: number;
  height: number;
  fontBoundingBoxAscent: number;
}

export interface IGlyph extends ITextMetrics {
  position: IPoint;
}

export interface IFontStyle {
  fontSize: number;
  fontFamily: string;
}

export const calcGlyphInfos = (content: string, fontStyle: IFontStyle) => {
  const glyphs: IGlyph[] = [];
  const position: IPoint = { x: 0, y: 0 };
  ctx.font = `${fontStyle.fontSize}px ${fontStyle.fontFamily}`;
  for (const c of content) {
    const textMetrics = ctx.measureText(c);
    glyphs.push({
      position: { ...position },
      width: textMetrics.width,
      height:
        textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent,
      fontBoundingBoxAscent: textMetrics.fontBoundingBoxAscent,
    });
    position.x += textMetrics.width;
  }
  // 末尾换行符
  glyphs.push({
    position: { ...position },
    width: 0,
    height: 0,
    fontBoundingBoxAscent: 0,
  });
  return glyphs;
};

export const calcTextSize = (
  content: string,
  fontStyle: IFontStyle,
): ITextMetrics => {
  ctx.font = `${fontStyle.fontSize}px ${fontStyle.fontFamily}`;
  const textMetrics = ctx.measureText(content);
  return {
    width: textMetrics.width,
    height:
      textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent,
    fontBoundingBoxAscent: textMetrics.fontBoundingBoxAscent,
  };
};
