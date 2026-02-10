import { identityMatrix } from '@suika/geo';
import { Application } from 'pixi.js';

import { SuikaShape } from './shape';

export class SuikaShapeApplication extends SuikaShape {
  app: Application;

  constructor() {
    super({ transform: identityMatrix(), width: 0, height: 0 });
    this.app = new Application();
    (window as any).__PIXI_APP__ = this.app;
  }

  override addChild(child: SuikaShape) {
    this.app.stage.addChild(child.graphics);
  }

  clear() {
    this.app.stage.removeChildren();
  }

  async init(options: {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    backgroundColor: number;
  }) {
    await this.app.init({
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: options.backgroundColor,
      antialias: true,
    });
  }
}
