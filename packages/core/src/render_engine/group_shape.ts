import { Matrix } from 'pixi.js';

import { type ShapeAttrs, SuikaShape } from './shape';

export interface GroupShapeAttrs extends ShapeAttrs {
  width: number;
  height: number;
}

export class GroupShape extends SuikaShape<GroupShapeAttrs> {
  override draw() {
    const attrs = this.attrs;
    this.graphics.clear();
    this.graphics.setFromMatrix(new Matrix(...attrs.transform));
  }
}
