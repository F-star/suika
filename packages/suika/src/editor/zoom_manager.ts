
import { ceil, viewportCoordsToSceneUtil } from '../utils/common';
import EventEmitter from '../utils/event_emitter';
import { Editor } from './editor';

export class ZoomManager {
  private zoom = 1;
  private eventEmitter = new EventEmitter();
  constructor(private editor: Editor) {}
  getZoom() {
    return this.zoom;
  }
  setZoom(zoom: number) {
    const prevZoom = this.zoom;
    this.zoom = zoom;
    Promise.resolve().then(() => { // 异步通知
      this.eventEmitter.emit('zoomChange', zoom, prevZoom);
    });
  }
  zoomIn(): void
  zoomIn(cx: number, cy: number): void
  zoomIn(cx?: number, cy?: number) {
    const zoomStep = this.editor.setting.zoomStep;
    const prevZoom = this.zoom;
    const zoom = Math.min(ceil(prevZoom * (1 + zoomStep)), this.editor.setting.zoomMax);

    this.setZoom(zoom);
    this.adjustScroll(cx, cy, prevZoom);
  }
  zoomOut(): void
  zoomOut(cx: number, cy: number): void
  zoomOut(cx?: number, cy?: number) {
    const zoomStep = this.editor.setting.zoomStep;
    const prevZoom = this.zoom;
    const zoom = Math.max(ceil(prevZoom * (1 - zoomStep)), this.editor.setting.zoomMin);

    this.setZoom(zoom);
    this.adjustScroll(cx, cy, prevZoom);
  }
  getCanvasCenter() {
    const width = this.editor.canvasElement.width;
    const height = this.editor.canvasElement.height;
    return {
      x: width / 2,
      y: height / 2,
    };
  }
  /**
   * 调整 scroll 值
   * 滚轮缩放时，选中点作为缩放中心进行缩放
   */
  adjustScroll(cx: number | undefined, cy: number | undefined, prevZoom: number) {
    const viewportManager = this.editor.viewportManager;
    const zoom = this.editor.zoomManager.getZoom();

    const { x: scrollX, y: scrollY } = viewportManager.getViewport();

    let _cx: number;
    let _cy: number;

    if (cx === undefined || cy === undefined) {
      const center = this.getCanvasCenter();
      _cx = center.x;
      _cy = center.y;
    } else {
      _cx = cx;
      _cy = cy;
    }

    const { x: sceneX, y: sceneY } = viewportCoordsToSceneUtil(_cx, _cy, prevZoom, scrollX, scrollY);
    const newScrollX = sceneX - _cx / zoom;
    const newScrollY = sceneY - _cy / zoom;

    viewportManager.setViewport({
      x: newScrollX,
      y: newScrollY,
    });
  }
  on(eventName:'zoomChange', handler: (zoom: number, prevZoom: number) => void) {
    this.eventEmitter.on(eventName, handler);
  }
  off(eventName:'zoomChange', handler: (zoom: number, prevZoom: number) => void) {
    this.eventEmitter.off(eventName, handler);
  }
}