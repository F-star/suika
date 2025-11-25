import { Matrix } from 'pixi.js';

import { type ShapeAttrs, SuikaShape } from './shape';

export interface RectShapeAttrs extends ShapeAttrs {
  width: number;
  height: number;
}

export class RectShape extends SuikaShape {
  // attrs: RectShapeAttrs;
  constructor() {
    super();
  }
  updateAttrs(attrs: RectShapeAttrs) {
    // this.attrs = attrs;
    // this.graphics.clear();
    // this.graphics.rect(0, 0, attrs.width, attrs.height);
    // this.graphics.setFromMatrix(new Matrix(...attrs.transform));
    // this.graphics.setFillStyle(0xff0044);
  }

  override draw() {
    debugger;
    this.graphics.clear();
    this.graphics.rect(0, 0, 100, 200);
    // this.graphics.setFromMatrix(new Matrix(...attrs.transform));
    this.graphics.fill('#f04');
  }
}
