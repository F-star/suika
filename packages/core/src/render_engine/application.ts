import { Application } from 'pixi.js';

class SuikaApplication {
  app: Application;

  constructor() {
    this.app = new Application();
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
