import { parseRGBAStr } from '@suika/common';

import { TextureType } from '../texture';
import { GraphType, Optional } from '../type';
import { rotateInCanvas } from '../utils';
import { Graph, GraphAttrs } from './graph';

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

  constructor(options: Optional<Omit<TextAttrs, 'id'>, 'width' | 'height'>) {
    super({
      ...options,
      type: GraphType.Text,
      width: options.width ?? DEFAULT_TEXT_WIDTH,
      height: options.height ?? DEFAULT_TEXT_WEIGHT,
    });

    if (options.autoFit) {
      tmpCtx.font = `${options.fontSize}px sans-serif`;
      const { width } = tmpCtx.measureText(options.content);
      this.attrs.width = width;
      this.attrs.height = options.fontSize;
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, rotation, fill, stroke, fontSize, content } =
      this.attrs;

    if (rotation) {
      const cx = x + width / 2;
      const cy = y + height / 2;

      rotateInCanvas(ctx, rotation, cx, cy);
    }
    ctx.beginPath();
    ctx.textBaseline = 'top';
    ctx.font = `${fontSize}px sans-serif`;

    for (const texture of fill ?? []) {
      switch (texture.type) {
        case TextureType.Solid: {
          ctx.fillStyle = parseRGBAStr(texture.attrs);
          break;
        }
        case TextureType.Image: {
          // TODO:
        }
      }
    }
    if (stroke) {
      // TODO:
    }

    ctx.fillText(content, x, y);
  }
}
