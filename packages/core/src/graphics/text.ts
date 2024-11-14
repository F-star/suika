import { escapeHtml, parseRGBAStr } from '@suika/common';
import {
  applyInverseMatrix,
  calcGlyphInfos,
  calcTextSize,
  type IGlyph,
  type IPoint,
  type ITextMetrics,
} from '@suika/geo';

import { PaintType } from '../paint';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IAdvancedAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';
import { type IDrawInfo } from './type';

export interface TextAttrs extends GraphicsAttrs {
  content: string;
  fontSize: number;
  fontFamily: string;
  autoFit?: boolean;
}

const DEFAULT_TEXT_WIDTH = 80;
const DEFAULT_TEXT_WEIGHT = 30;

const tmpCtx = document.createElement('canvas').getContext('2d')!;

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

    if (attrs.autoFit) {
      tmpCtx.font = `${attrs.fontSize}px ${attrs.fontFamily}`;
      const { width } = tmpCtx.measureText(attrs.content);
      this.attrs.width = width;
      this.attrs.height = attrs.fontSize;
    }
  }

  override updateAttrs(partialAttrs: Partial<TextAttrs> & IAdvancedAttrs) {
    const isContentChanged =
      'content' in partialAttrs && partialAttrs.content !== this.attrs.content;
    const isFontChanged =
      'fontSize' in partialAttrs || 'fontFamily' in partialAttrs;
    const isFontFamilyChanged =
      'fontFamily' in partialAttrs &&
      partialAttrs.fontFamily !== this.attrs.fontFamily;

    if (isContentChanged || isFontChanged || isFontFamilyChanged) {
      this._glyphs = null;
    }
    super.updateAttrs(partialAttrs);
  }

  override draw(drawInfo: IDrawInfo) {
    const opacity = this.getOpacity() * (drawInfo.opacity ?? 1);
    if (!this.isVisible() || opacity === 0) return;
    const { transform, fill, stroke, fontSize, content, fontFamily } =
      this.attrs;
    const { ctx } = drawInfo;
    ctx.save();
    ctx.transform(...transform);
    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }
    ctx.beginPath();
    // TODO: Don't hardcode this, should provide a default value from external source
    ctx.font = `${fontSize}px ${fontFamily ?? 'sans-serif'}`;

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

    ctx.fontKerning = 'none'; // no kerning
    ctx.translate(0, this.getContentMetrics().fontBoundingBoxAscent);
    ctx.fillText(content, 0, 0);
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

  getGlyphs() {
    if (this._glyphs) return this._glyphs;
    this._glyphs = calcGlyphInfos(this.attrs.content, {
      fontSize: this.attrs.fontSize,
      fontFamily: this.attrs.fontFamily,
    });
    return this._glyphs;
  }

  getContentMetrics() {
    if (this.contentMetrics) return this.contentMetrics;
    this.contentMetrics = calcTextSize(this.attrs.content, {
      fontSize: this.attrs.fontSize,
      fontFamily: this.attrs.fontFamily,
    });
    return this.contentMetrics;
  }

  getContentLength() {
    return this.getGlyphs().length - 1;
  }

  getCursorIndex(point: IPoint) {
    point = applyInverseMatrix(this.attrs.transform, point);
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
}
