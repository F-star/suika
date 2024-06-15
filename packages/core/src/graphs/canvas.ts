import { identityMatrix } from '@suika/geo';

import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';

type SuikaCanvasAttrs = GraphicsAttrs;

export class SuikaCanvas extends SuikaGraphics<SuikaCanvasAttrs> {
  override type = GraphicsType.Canvas;
  protected override isContainer = true;

  constructor(
    attrs: Optional<SuikaCanvasAttrs, 'id' | 'transform'>,
    opts: IGraphicsOpts,
  ) {
    super({ ...attrs, type: GraphicsType.Canvas }, opts);
  }

  override getWorldTransform() {
    return identityMatrix();
  }
}
