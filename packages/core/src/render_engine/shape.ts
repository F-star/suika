import { type IMatrixArr } from '@suika/geo';
import { Graphics } from 'pixi.js';

export interface ShapeAttrs {
  transform: IMatrixArr;
  width: number;
  height: number;
}

export class SuikaShape<ATTRS extends ShapeAttrs = ShapeAttrs> {
  attrs: ATTRS;
  graphics: Graphics;
  constructor(attrs: ATTRS) {
    this.attrs = attrs;
    this.graphics = new Graphics();
    this.draw();
  }

  addChild(child: SuikaShape) {
    this.graphics.addChild(child.graphics);
  }

  updateAttrs(partialAttrs: Partial<ATTRS>) {
    this.attrs = {
      ...this.attrs,
      ...partialAttrs,
    };
    this.draw();
  }

  draw() {
    // TODO: implement
  }
}
