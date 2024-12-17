import { getDevicePixelRatio } from '@suika/common';
import { Application, Container, GraphicsContextSystem, Matrix } from 'pixi.js';

import { type Editor } from './editor';

export class StageManager {
  private app: Application;
  private stage: Container;
  private scene: Container;

  constructor(private editor: Editor) {
    GraphicsContextSystem.defaultOptions.bezierSmoothness = 0.99;

    this.app = new Application();
    this.stage = this.app.stage;
    // 图形绘制的位置
    this.scene = new Container();
    this.stage.addChild(this.scene);
  }

  getScene() {
    return this.scene;
  }

  async init(canvas: HTMLCanvasElement) {
    const { width, height } = this.editor.viewportManager.getViewport();
    await this.app.init({
      canvas,
      // preference: 'webgpu',
      width,
      height,
      antialias: true,
      resolution: getDevicePixelRatio(),
      background: this.editor.setting.get('canvasBgColor'),
    });

    this.setSceneTfFromViewportAndZoom();
    this.bindEvent();
  }

  private setSceneTfFromViewportAndZoom = () => {
    const { x, y } = this.editor.viewportManager.getViewport();
    const zoom = this.editor.zoomManager.getZoom();
    const matrix = new Matrix().translate(-x, -y).scale(zoom, zoom);
    this.scene.setFromMatrix(matrix);
  };

  private onViewportSizeChange = (width: number, height: number) => {
    this.app.renderer.resize(width, height, getDevicePixelRatio());
  };

  private bindEvent() {
    this.editor.viewportManager.on(
      'xOrYChange',
      this.setSceneTfFromViewportAndZoom,
    );
    this.editor.zoomManager.on(
      'zoomChange',
      this.setSceneTfFromViewportAndZoom,
    );
    this.editor.viewportManager.on('sizeChange', this.onViewportSizeChange);
    this.bindRenderTickEvent();
  }

  private unbindEvent() {
    this.editor.viewportManager.off(
      'xOrYChange',
      this.setSceneTfFromViewportAndZoom,
    );
    this.editor.zoomManager.off(
      'zoomChange',
      this.setSceneTfFromViewportAndZoom,
    );
    this.editor.viewportManager.off('sizeChange', this.onViewportSizeChange);
  }

  addItems(graphs: Container[]) {
    this.scene.addChild(...graphs);
  }

  addView(container: Container) {
    this.stage.addChild(container);
  }

  bindRenderTickEvent() {
    this.app.ticker.add(
      () => {
        if (this.editor.sceneGraph.showBoxAndHandleWhenSelected) {
          this.editor.selectedBox.updateBoxAndDraw();
          const box = this.editor.selectedBox.getBox();
          this.editor.controlHandleManager.draw(box);
        } else {
          this.editor.selectedBox.clear();
          this.editor.controlHandleManager.clear();
        }
      },
      // null,
      // UPDATE_PRIORITY.HIGH,
    );
  }

  public destroy() {
    this.unbindEvent();
  }
}
