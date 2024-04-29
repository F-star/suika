import { parseRGBAStr } from '@suika/common';
import { Matrix, Text, TextStyle } from 'pixi.js';

import { PaintType } from '../paint';
import { GraphType, type Optional } from '../type';
import { Graph, type GraphAttrs, type IGraphOpts } from './graph';

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
    opts?: IGraphOpts,
  ) {
    super(
      {
        ...attrs,
        type: GraphType.Text,
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

  override updateAttrs(partialAttrs: Partial<TextAttrs> & IGraphOpts) {
    super.updateAttrs(partialAttrs);
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

    this.drawByPixi();
  }

  override drawByPixi() {
    if (!this.graphics) {
      this.graphics = new Text();
    }
    const textGraphics = this.graphics as Text;

    const parent = textGraphics.parent;
    const scale = parent ? parent.localTransform.a ?? 1 : 1;

    const attrs = this.attrs;
    textGraphics.visible = attrs.visible ?? true;
    const { x, y } = this.getPosition();
    textGraphics.setFromMatrix(
      new Matrix(...attrs.transform).prepend(
        new Matrix()
          .translate(-x, -y)
          .scale(1 / scale, 1 / scale)
          .translate(x, y),
      ),
    );

    const style = new TextStyle({
      // fontFamily: 'Arial',
      fontSize: attrs.fontSize * scale,
      // fill: { fill },
      // stroke: { color: '#4a1850', width: 5, join: 'round' },
      // dropShadow: {
      //   color: '#000000',
      //   blur: 4,
      //   angle: Math.PI / 6,
      //   distance: 6,
      // },
      // wordWrap: true,
      // wordWrapWidth: 440,
    });

    textGraphics.text = attrs.content;
    textGraphics.style = style;
  }
}
