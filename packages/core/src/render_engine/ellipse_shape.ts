import { Matrix } from 'pixi.js';

import { type ShapeAttrs, SuikaShape } from './shape';

export interface EllipseShapeAttrs extends ShapeAttrs {}

export class EllipseShape extends SuikaShape<EllipseShapeAttrs> {
  constructor(attrs: EllipseShapeAttrs) {
    super(attrs);
  }

  // protected createShape() {
  //   this.shape = new SuikaShape();
  //   this.shape.graphics.label = this.attrs.objectName;
  // }

  override draw() {
    const attrs = this.attrs;
    this.graphics.clear();
    this.graphics.ellipse(
      attrs.width / 2,
      attrs.height / 2,
      attrs.width / 2,
      attrs.height / 2,
    );
    this.graphics.setFromMatrix(new Matrix(...attrs.transform));
    this.graphics.stroke('#f04');
  }
}
