import { escapeHtml, parseRGBAStr } from '@suika/common';
import {
  applyInverseMatrix,
  type IMatrixArr,
  type IPoint,
  Matrix,
} from '@suika/geo';

import { fontManager } from '../../font_manager';
import { type IPaint, PaintType } from '../../paint';
import { GraphicsType, type Optional } from '../../type';
import {
  type GraphicsAttrs,
  type IAdvancedAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from '../graphics';
import { type IDrawInfo } from '../type';
import { drawLayer } from '../utils';
import { Paragraph } from './paragraph';
import { type ILetterSpacing, type ILineHeight } from './type';

export interface TextAttrs extends GraphicsAttrs {
  content: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: ILineHeight;
  letterSpacing: ILetterSpacing;

  autoFit?: boolean;
}

const DEFAULT_TEXT_WIDTH = 80;
const DEFAULT_TEXT_WEIGHT = 30;

export class SuikaText extends SuikaGraphics<TextAttrs> {
  override type = GraphicsType.Text;

  paragraph: Paragraph;

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
        lineHeight: attrs.lineHeight ?? { value: 1, units: 'RAW' },
        letterSpacing: attrs.letterSpacing ?? { value: 0, units: 'PIXELS' },
      },
      opts,
    );

    this.paragraph = new Paragraph({
      content: attrs.content,
      fontSize: attrs.fontSize,
      fontFamily: attrs.fontFamily,
      lineHeight: this.attrs.lineHeight,
      letterSpacing: this.attrs.letterSpacing,
    });
  }

  override updateAttrs(partialAttrs: Partial<TextAttrs> & IAdvancedAttrs) {
    const isContentChanged =
      'content' in partialAttrs && partialAttrs.content !== this.attrs.content;
    const isFontSizeChanged = 'fontSize' in partialAttrs;
    const isFontFamilyChanged =
      'fontFamily' in partialAttrs &&
      partialAttrs.fontFamily !== this.attrs.fontFamily;
    const isLetterSpacingChanged = 'letterSpacing' in partialAttrs;
    const isLineHeightChanged = 'lineHeight' in partialAttrs;
    super.updateAttrs(partialAttrs);

    if (
      isContentChanged ||
      isFontSizeChanged ||
      isFontFamilyChanged ||
      isLetterSpacingChanged ||
      isLineHeightChanged
    ) {
      const { content, fontSize, fontFamily } = this.attrs;
      // recompute
      this.paragraph = new Paragraph({
        content,
        fontSize,
        fontFamily,
        lineHeight: this.attrs.lineHeight,
        letterSpacing: this.attrs.letterSpacing,
      });
    }
  }

  fitContent() {
    const { width, height } = this.paragraph.getLayoutSize();
    if (width === this.attrs.width && height === this.attrs.height) {
      return;
    }
    this.attrs.width = width;
    this.attrs.height = height;
    this.clearBboxCache();
  }

  private _realDraw(
    drawInfo: IDrawInfo,
    overrideStyle?: {
      fill?: IPaint[];
      stroke?: IPaint[];
      strokeWidth?: number;
      transform: IMatrixArr;
    },
  ) {
    const { ctx } = drawInfo;
    const { fill, strokeWidth, stroke, transform } =
      overrideStyle || this.attrs;

    ctx.save();
    ctx.transform(...transform);

    const draw = (layerCtx: CanvasRenderingContext2D) => {
      const glyphs = this.getGlyphs();
      const font = fontManager.getFont(this.attrs.fontFamily);

      layerCtx.save();

      const fontSize = this.attrs.fontSize;
      const fontSizeScale = fontSize / font.unitsPerEm;

      const unitsPerEm = font.unitsPerEm;
      const ascender = font.ascender as number;
      const descender = font.descender as number;
      const lineGap = font.tables.hhea.lineGap as number;

      const defaultLineHeight =
        (ascender - descender + lineGap) * fontSizeScale;
      const actualLineHeight = this.getActualLineHeight();
      const halfPadding =
        (actualLineHeight - defaultLineHeight) / 2 / fontSizeScale;

      const matrix = new Matrix()
        .scale(1, -1)
        .translate(0, ascender + lineGap / 2 + halfPadding)
        .scale(fontSize / unitsPerEm, fontSize / unitsPerEm);

      // Build text paths with their positions
      const textPaths: Array<{ path: Path2D; x: number; y: number }> = [];
      for (const line of glyphs) {
        for (const glyph of line) {
          const path2d = new Path2D(glyph.commands);
          textPaths.push({
            path: path2d,
            x: glyph.position.x,
            y: glyph.position.y,
          });
        }
      }

      // Apply font transform matrix
      layerCtx.transform(...matrix.getArray());

      // Calculate inverse matrix scale factor for strokeWidth
      // The matrix scale factor is fontSize / unitsPerEm, so we need to divide strokeWidth by it
      // to keep strokeWidth constant in pixel space
      const scale = fontSize / unitsPerEm;

      // Apply fills
      for (const paint of fill ?? []) {
        if (paint.visible === false) continue;
        switch (paint.type) {
          case PaintType.Solid: {
            layerCtx.fillStyle = parseRGBAStr(paint.attrs);
            for (const { path, x, y } of textPaths) {
              layerCtx.save();
              layerCtx.translate(x, y);
              layerCtx.fill(path);
              layerCtx.restore();
            }
            break;
          }
          case PaintType.Image: {
            // TODO:
          }
        }
      }

      // Apply strokes
      if (strokeWidth) {
        layerCtx.lineWidth = strokeWidth / scale;
        layerCtx.miterLimit = 8;
        for (const paint of stroke ?? []) {
          if (paint.visible === false) continue;
          switch (paint.type) {
            case PaintType.Solid: {
              layerCtx.strokeStyle = parseRGBAStr(paint.attrs);
              for (const { path, x, y } of textPaths) {
                layerCtx.save();
                layerCtx.translate(x, y);
                layerCtx.stroke(path);
                layerCtx.restore();
              }
              break;
            }
            case PaintType.Image: {
              // TODO: stroke image
            }
          }
        }
      }

      layerCtx.restore();
    };

    const opacity = drawInfo.opacity ?? 1;
    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }

    if (opacity !== 1) {
      drawLayer({
        originCtx: ctx,
        viewSize: this.doc.getDeviceViewSize(),
        draw,
      });
    } else {
      draw(ctx);
    }

    ctx.restore();
  }

  override draw(drawInfo: IDrawInfo) {
    if (this.shouldSkipDraw(drawInfo)) return;

    const opacity = this.getOpacity() * (drawInfo.opacity ?? 1);
    this._realDraw({ ...drawInfo, opacity });
  }

  protected override getSVGTagHead(offset?: IPoint) {
    const tf = this.getWorldTransform();
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
    return this.paragraph.getGlyphs();
  }

  getActualLineHeight() {
    return this.paragraph.getLineHeightPx();
  }

  getContentLength() {
    // -1 because of the fallback newline character
    return this.paragraph.getGlyphCount() - 1;
  }

  protected override isFillShouldRender() {
    // TODO: optimize
    return true;
  }

  getCursorIndex(point: IPoint) {
    point = applyInverseMatrix(this.getWorldTransform(), point);
    const font = fontManager.getFont(this.attrs.fontFamily);
    const scale = this.attrs.fontSize / font.unitsPerEm;
    const matrix = new Matrix().scale(scale, scale);
    point = matrix.applyInverse(point);

    return this.paragraph.getGlyphIndexByPt(point);
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
