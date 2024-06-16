import { boxToRect, Matrix, mergeBoxes } from '@suika/geo';

import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';

interface FrameAttrs extends GraphicsAttrs {
  resizeToFit: boolean;
}

export class SuikaFrame extends SuikaGraphics<FrameAttrs> {
  override type = GraphicsType.Frame;
  protected override isContainer = true;

  constructor(
    attrs: Optional<FrameAttrs, 'id' | 'transform'>,
    opts: IGraphicsOpts,
  ) {
    super({ ...attrs, type: GraphicsType.Frame }, opts);
  }

  // children 中有图形 size 进行了更新，frame 需要重新 size
  updateSizeByChildren(
    originAttrsMap: Map<string, Partial<GraphicsAttrs>>,
    updatedAttrsMap: Map<string, Partial<GraphicsAttrs>>,
  ) {
    const boundingRect = boxToRect(
      mergeBoxes(
        this.children
          .filter((item) => item.isVisible())
          .map((item) => item.getLocalBbox()),
      ),
    );

    if (
      boundingRect.x === 0 &&
      boundingRect.y === 0 &&
      boundingRect.width === this.attrs.width &&
      boundingRect.height === this.attrs.height
    ) {
      // size has no changed
      return;
    }

    for (const child of this.children) {
      const id = child.attrs.id;

      originAttrsMap.set(
        id,
        Object.assign(
          {
            transform: [...child.attrs.transform],
          },
          originAttrsMap.get(id) ?? {},
        ),
      );

      const tf = new Matrix(...child.attrs.transform).translate(
        -boundingRect.x,
        -boundingRect.y,
      );
      child.updateAttrs({
        transform: tf.getArray(),
      });

      const updatedAttrs = Object.assign(updatedAttrsMap.get(id) ?? {}, {
        transform: [...child.attrs.transform],
      });
      updatedAttrsMap.set(id, updatedAttrs);
    }

    const translateTf = new Matrix().translate(boundingRect.x, boundingRect.y);
    const tf = new Matrix(...this.attrs.transform).append(translateTf);

    const id = this.attrs.id;
    if (!originAttrsMap.has(id)) {
      originAttrsMap.set(id, {
        width: this.attrs.width,
        height: this.attrs.height,
        transform: [...this.attrs.transform],
      });
    }

    const updatedAttrs = {
      width: boundingRect.width,
      height: boundingRect.height,
      transform: tf.getArray(),
    };
    this.updateAttrs(updatedAttrs);
    updatedAttrsMap.set(id, updatedAttrs);
  }

  isEmpty() {
    return this.children.length === 0;
  }
}

export const isGroupGraphics = (
  graphics: SuikaGraphics,
): graphics is SuikaFrame => {
  return graphics instanceof SuikaFrame && graphics.attrs.resizeToFit;
};

export const isFrameGraphics = (
  graphics: SuikaGraphics,
): graphics is SuikaFrame => {
  return graphics instanceof SuikaFrame;
};
