import { type IMatrixArr } from '@suika/geo';
import { Graphics } from 'pixi.js';

export interface ShapeAttrs {
  transform: IMatrixArr;
}

export class SuikaShape {
  graphics: Graphics;
  constructor() {
    this.graphics = new Graphics();
    this.draw();
  }

  addChild(child: SuikaShape) {
    this.graphics.addChild(child.graphics);
  }

  draw() {
    // TODO: implement
  }
}
