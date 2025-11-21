import { Matrix } from 'pixi.js';

import { Shape, type ShapeAttrs } from './shape';

export interface RectShapeAttrs extends ShapeAttrs {
  width: number;
  height: number;
}

export class RectShape extends Shape {
  constructor() {
    super();
  }
  updateAttrs(attrs: RectShapeAttrs) {
    this.graphics.clear();
    this.graphics.rect(0, 0, attrs.width, attrs.height);
    this.graphics.setFromMatrix(new Matrix(...attrs.transform));
  }
}
