import { escapeHtml, parseRGBAStr } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { PaintType } from '../paint';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IAdvancedAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';

export interface TextAttrs extends GraphicsAttrs {
  content: string;
  fontSize: number;
  autoFit?: boolean;
}

const DEFAULT_TEXT_WIDTH = 80;
const DEFAULT_TEXT_WEIGHT = 30;

const tmpCtx = document.createElement('canvas').getContext('2d')!;

export class SuikaText extends SuikaGraphics<TextAttrs> {
  override type = GraphicsType.Text;

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
      tmpCtx.font = `${attrs.fontSize}px sans-serif`;
      const { width } = tmpCtx.measureText(attrs.content);
      this.attrs.width = width;
      this.attrs.height = attrs.fontSize;
    }
  }

  override updateAttrs(partialAttrs: Partial<TextAttrs> & IAdvancedAttrs) {
    super.updateAttrs(partialAttrs);
  }

  override draw(ctx: CanvasRenderingContext2D) {
    const { transform, fill, stroke, fontSize, content } = this.attrs;
    ctx.save();
    ctx.transform(...transform);
    ctx.beginPath();
    ctx.textBaseline = 'top';
    ctx.font = `${fontSize}px sans-serif`;

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
}
