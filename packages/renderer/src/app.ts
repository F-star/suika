import InitCanvasKit, { type CanvasKit } from 'canvaskit-wasm';
import CanvasKitWasm from 'canvaskit-wasm/bin/canvaskit.wasm?url';

export class App {
  private canvas: HTMLCanvasElement;
  private CanvasKit!: CanvasKit;

  constructor() {
    this.canvas = document.createElement('canvas');
  }

  async init() {
    const CanvasKit = await InitCanvasKit({
      locateFile: () => CanvasKitWasm,
    });
    this.CanvasKit = CanvasKit;

    const canvas = document.createElement('canvas');
    this.canvas = canvas;

    const surface = CanvasKit.MakeWebGLCanvasSurface(canvas)!;

    surface.drawOnce((canvas) => {
      // const ctx = canvas.
    });
  }
}
