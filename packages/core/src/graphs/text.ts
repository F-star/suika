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

export class TextGraph extends Graph {
  content: string;
  fontSize: number;
  autoFit?: boolean;
  constructor(options: Optional<TextAttrs, 'width' | 'height'>) {
    super({
      ...options,
      type: GraphType.Text,
      width: options.width ?? DEFAULT_TEXT_WIDTH,
      height: options.height ?? DEFAULT_TEXT_WEIGHT,
    });

    if (options.autoFit) {
      tmpCtx.font = `${options.fontSize}px sans-serif`;
      const { width } = tmpCtx.measureText(options.content);
      this.width = width;
      this.height = options.fontSize;
    }

    this.autoFit = options.autoFit;
    this.content = options.content;
    this.fontSize = options.fontSize;
  }
  override getAttrs(): TextAttrs {
    return {
      ...super.getAttrs(),
      content: this.content,
      fontSize: this.fontSize,
      autoFit: this.autoFit,
    };
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.rotation) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;

      rotateInCanvas(ctx, this.rotation, cx, cy);
    }
    ctx.beginPath();
    ctx.textBaseline = 'top';
    ctx.font = `${this.fontSize}px sans-serif`;

    for (const texture of this.fill) {
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
    if (this.stroke) {
      // TODO:
    }

    ctx.fillText(this.content, this.x, this.y);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      content: this.content,
    };
  }
}
