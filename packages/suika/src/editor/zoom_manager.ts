
import { ceil } from '../utils/common';
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
    console.log('zoom:', zoom);
    const prevZoom = this.zoom;
    this.zoom = zoom;
    Promise.resolve(() => { // 异步通知
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
    // (cx, cy) 是视口坐标系中的坐标
    // 计算缩放前 (cx, cy) 离视口左上角的 “场景坐标距离”
    const dx = _cx * prevZoom - scrollX;
    const dy = _cy * prevZoom - scrollY;
    // 计算缩放后的 (cx * zoom, cy * zoom)，将它们减去 dx dy
    // 这样就能减回去了，dx dy 保持不变的
    const newScrollX = _cx * zoom - dx;
    const newScrollY = _cy * zoom - dy;

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