import { type IMatrixArr } from '@suika/geo';
import { Graphics } from 'pixi.js';

export interface ShapeAttrs {
  transform: IMatrixArr;
}

export class Shape {
  protected graphics: Graphics;
  constructor() {
    this.graphics = new Graphics();
  }

  addChild(child: Shape) {
    this.graphics.addChild(child.graphics);
  }
}
