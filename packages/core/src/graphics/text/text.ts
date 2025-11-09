import { escapeHtml, parseRGBAStr } from '@suika/common';
import {
  applyInverseMatrix,
  type IGlyph,
  type IPoint,
  type ITextMetrics,
  Matrix,
} from '@suika/geo';
import { type Font } from 'opentype.js';

import { fontManager } from '../../font_manager';
import { PaintType } from '../../paint';
import { GraphicsType, type Optional } from '../../type';
import {
  type GraphicsAttrs,
  type IAdvancedAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from '../graphics';
import { type IDrawInfo } from '../type';
import { calcGlyphInfos } from './utils';

export interface TextAttrs extends GraphicsAttrs {
  content: string;
  fontSize: number;
  fontFamily: string;
  autoFit?: boolean;
  // e.g. fontName: { family: "Anonymous Pro", style: "Regular", postscript: "AnonymousPro-Regular" },
  // fontName: {
  //   family: string;
  //   style: 'Regular' | 'Oblique' | 'Bold' | 'BoldOblique';
  // };
  // glyphs?: {
  //   position: IPoint;
  //   commands: IPathCommand[];
  // }[];
}

const DEFAULT_TEXT_WIDTH = 80;
const DEFAULT_TEXT_WEIGHT = 30;

export class SuikaText extends SuikaGraphics<TextAttrs> {
  override type = GraphicsType.Text;

  private _glyphs: IGlyph[] | null = null;
  private contentMetrics: ITextMetrics | null = null;

  constructor(
    attrs: Optional<Omit<TextAttrs, 'id'>, 'width' | 'height' | 'transform'>,
    opts: IGraphicsOpts,
  ) {
    super(
      {
        ...attrs,
        type: GraphicsType.Text,
        width: attrs.width ?? DEFAULT_TEXT_WIDTH,
        height: attrs.height ?? DEFAULT_TEXT_WEIGHT,
      },
      opts,
    );
  }

  override updateAttrs(partialAttrs: Partial<TextAttrs> & IAdvancedAttrs) {
    const isContentChanged =
      'content' in partialAttrs && partialAttrs.content !== this.attrs.content;
    const isFontSizeChanged = 'fontSize' in partialAttrs;
    const isFontFamilyChanged =
      'fontFamily' in partialAttrs &&
      partialAttrs.fontFamily !== this.attrs.fontFamily;

    if (isContentChanged || isFontSizeChanged || isFontFamilyChanged) {
      this._glyphs = null;
      this.contentMetrics = null;
    }
    super.updateAttrs(partialAttrs);
  }

  fitContent() {
    const { width, height } = this.getContentMetrics();
    this.attrs.width = width;
    this.attrs.height = height;
  }

  override draw(drawInfo: IDrawInfo) {
    if (this.shouldSkipDraw(drawInfo)) return;

    const opacity = this.getOpacity() * (drawInfo.opacity ?? 1);
    const { transform, fill, stroke } = this.attrs;
    const { ctx } = drawInfo;
    ctx.save();
    ctx.transform(...transform);
    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }
    ctx.beginPath();

    for (const paint of fill ?? []) {
      switch (paint.type) {
        case PaintType.Solid: {
          ctx.fillStyle = parseRGBAStr(paint.attrs);
          break;
        }
        case PaintType.Image: {
          // TODO:
        }
      }
    }
    if (stroke) {
      // TODO:
    }

    this.drawText(ctx);
    ctx.restore();
  }

  private fontUnitToPx(font: Font, unit: number) {
    return unit * (this.attrs.fontSize / font.unitsPerEm);
  }

  private drawText(ctx: CanvasRenderingContext2D) {
    const glyphs = this.getGlyphs();
    const font = fontManager.getFont(this.attrs.fontFamily);

    ctx.save();

    const fontSize = this.attrs.fontSize;
    const fontSizeScale = fontSize / font.unitsPerEm;

    const unitsPerEm = font.unitsPerEm;
    const ascender = font.ascender as number;
    const descender = font.descender as number;
    const lineGap = font.tables.hhea.lineGap as number;

    const defaultLineHeight = (ascender - descender + lineGap) * fontSizeScale;
    const actualLineHeight = Math.round(defaultLineHeight);

    const halfPadding = (actualLineHeight - defaultLineHeight) / fontSizeScale;

    const matrix = new Matrix()
      .scale(1, -1)
      .translate(0, ascender + lineGap / 2 + halfPadding)
      .scale(fontSize / unitsPerEm, fontSize / unitsPerEm);

    ctx.transform(...matrix.getArray());

    for (const glyph of glyphs) {
      ctx.save();
      ctx.translate(glyph.position.x, glyph.position.y);
      const path2d = new Path2D(glyph.commands);
      ctx.fill(path2d);
      ctx.restore();
    }
    ctx.restore();
  }

  protected override getSVGTagHead(offset?: IPoint) {
    const tf = [...this.attrs.transform];
    tf[5] += this.attrs.fontSize;
    if (offset) {
      tf[4] += offset.x;
      tf[5] += offset.y;
    }
    return `<text x="0" y="0" transform="matrix(${tf.join(' ')})"`;
  }

  protected override getSVGTagTail(): string {
    const content = escapeHtml(this.attrs.content);
    return `>${content}</text>`;
  }

  override getLayerIconPath() {
    return 'M0 0H11V3H10V1H6V9H7.5V10H3.5V9H5V1H1V3H0V0Z';
  }

  getGlyphs() {
    if (this._glyphs) return this._glyphs;
    this._glyphs = calcGlyphInfos(this.attrs.content, {
      fontSize: this.attrs.fontSize,
      fontFamily: this.attrs.fontFamily,
    });
    return this._glyphs;
  }

  /**
   * the unit of the metrics is Pixel
   */
  getContentMetrics() {
    if (this.contentMetrics) return this.contentMetrics;
    const glyphs = this.getGlyphs();
    const font = fontManager.getFont(this.attrs.fontFamily);
    const lastGlyph = glyphs[glyphs.length - 1];

    const lineHeight = Math.round(this.getDefaultLineHeight());

    this.contentMetrics = {
      width: this.fontUnitToPx(font, lastGlyph.position.x + lastGlyph.width),
      height: lineHeight,
    };
    return this.contentMetrics;
  }

  private getDefaultLineHeight() {
    const font = fontManager.getFont(this.attrs.fontFamily);
    const ascender = font.tables.hhea.ascender as number;
    const descender = font.tables.hhea.descender as number;
    const lineGap = font.tables.hhea.lineGap as number;
    return this.fontUnitToPx(font, ascender - descender + lineGap);
  }

  getActualLineHeight() {
    return this.getContentMetrics().height;
  }

  getContentLength() {
    return this.getGlyphs().length - 1;
  }

  protected override isFillShouldRender() {
    // TODO: optimize
    return true;
  }

  getCursorIndex(point: IPoint) {
    point = applyInverseMatrix(this.getWorldTransform(), point);
    const font = fontManager.getFont(this.attrs.fontFamily);
    const scale = this.attrs.fontSize / font.unitsPerEm;
    const matrix = new Matrix()
      .translate(0, this.attrs.fontSize)
      .scale(scale, -scale);
    point = matrix.applyInverse(point);
    const glyphs = this.getGlyphs();

    // binary search, find the nearest but not greater than point.x glyph index
    let left = 0;
    let right = glyphs.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const glyph = glyphs[mid];
      if (point.x < glyph.position.x) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    if (left === 0) return 0;
    if (left >= glyphs.length) return glyphs.length - 1;

    if (
      glyphs[left].position.x - point.x >
      point.x - glyphs[right].position.x
    ) {
      return right;
    }
    return left;
  }

  override getInfoPanelAttrs() {
    return [
      ...super.getInfoPanelAttrs(),
      {
        label: '',
        key: 'fontSize',
        value: this.attrs.fontSize,
        min: 1,
        max: 100,
        uiType: 'number',
      },
      {
        label: '',
        key: 'fontFamily',
        value: this.attrs.fontFamily,
        uiType: 'string',
      },
    ];
  }
}
