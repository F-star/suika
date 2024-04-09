import { parseRGBAStr } from '@suika/common';

import { PaintType } from '../paint';
import { GraphType, type Optional } from '../type';
import { Graph, type GraphAttrs } from './graph';

export interface TextAttrs extends GraphAttrs {
  content: string;
  fontSize: number;
  autoFit?: boolean;
}

const DEFAULT_TEXT_WIDTH = 80;
const DEFAULT_TEXT_WEIGHT = 30;

const tmpCtx = document.createElement('canvas').getContext('2d')!;

export class TextGraph extends Graph<TextAttrs> {
  override type = GraphType.Text;

  constructor(
    attrs: Optional<Omit<TextAttrs, 'id'>, 'width' | 'height' | 'transform'>,
  ) {
    super({
      ...attrs,
      type: GraphType.Text,
      width: attrs.width ?? DEFAULT_TEXT_WIDTH,
      height: attrs.height ?? DEFAULT_TEXT_WEIGHT,
    });

    if (attrs.autoFit) {
      tmpCtx.font = `${attrs.fontSize}px sans-serif`;
      const { width } = tmpCtx.measureText(attrs.content);
      this.attrs.width = width;
      this.attrs.height = attrs.fontSize;
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    const { transform, fill, stroke, fontSize, content } = this.attrs;
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
  }
}
