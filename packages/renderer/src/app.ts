import InitCanvasKit, { type CanvasKit } from 'canvaskit-wasm';
import CanvasKitWasm from 'canvaskit-wasm/bin/canvaskit.wasm?url';

export class App {
  private canvas: HTMLCanvasElement;
  private CK!: CanvasKit;

  constructor() {
    this.canvas = document.createElement('canvas');
  }

  async init() {
    const CK = await InitCanvasKit({
      locateFile: () => CanvasKitWasm,
    });
    this.CK = CK;

    const canvas = document.createElement('canvas');
    this.canvas = canvas;

    const surface = CK.MakeWebGLCanvasSurface(canvas)!;

    surface.drawOnce((canvas) => {
      // canvas.drawRect()
    });
  }
}
