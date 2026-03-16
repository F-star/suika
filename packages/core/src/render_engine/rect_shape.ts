import { Matrix } from 'pixi.js';

import { type ShapeAttrs, SuikaShape } from './shape';

export interface RectShapeAttrs extends ShapeAttrs {
  width: number;
  height: number;
}

export class RectShape extends SuikaShape<RectShapeAttrs> {
  constructor(attrs: RectShapeAttrs) {
    super(attrs);
  }

  // protected createShape() {
  //   this.shape = new SuikaShape();
  //   this.shape.graphics.label = this.attrs.objectName;
  // }

  override draw() {
    const attrs = this.attrs;
    this.graphics.clear();
    this.graphics.rect(0, 0, attrs.width, attrs.height);
    this.graphics.setFromMatrix(new Matrix(...attrs.transform));
    this.graphics.stroke('#f04');
  }
}
