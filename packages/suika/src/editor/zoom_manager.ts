import { remainDecimal, viewportCoordsToSceneUtil } from '../utils/common';
import EventEmitter from '../utils/event_emitter';
import { getRectsBBox } from '../utils/graphics';
import { Editor } from './editor';

interface Events {
  zoomChange(zoom: number, prevZoom: number): void;
}

export class ZoomManager {
  private zoom = 1;
  private eventEmitter = new EventEmitter<Events>();
  constructor(private editor: Editor) {}
  getZoom() {
    return this.zoom;
  }
  setZoom(zoom: number) {
    const prevZoom = this.zoom;

    // limit zoom range
    const zoomMax = this.editor.setting.get('zoomMax');
    if (zoom > zoomMax) {
      zoom = zoomMax;
    }

    const zoomMin = this.editor.setting.get('zoomMin');
    if (zoom < zoomMin) {
      zoom = zoomMin;
    }

    this.zoom = zoom;
    Promise.resolve().then(() => {
      // 异步通知
      this.eventEmitter.emit('zoomChange', zoom, prevZoom);
    });
  }
  setZoomAndUpdateViewport(zoom: number) {
    const prevZoom = this.zoom;
    this.setZoom(zoom);
    this.adjustScroll(undefined, undefined, prevZoom);
  }
  zoomIn(): void;
  zoomIn(cx: number, cy: number): void;
  zoomIn(cx?: number, cy?: number) {
    const zoomStep = this.editor.setting.get('zoomStep');
    const prevZoom = this.zoom;
    const zoom = Math.min(
      remainDecimal(prevZoom * (1 + zoomStep)),
      this.editor.setting.get('zoomMax'),
    );

    this.setZoom(zoom);
    this.adjustScroll(cx, cy, prevZoom);
  }
  zoomOut(): void;
  zoomOut(cx: number, cy: number): void;
  zoomOut(cx?: number, cy?: number) {
    const zoomStep = this.editor.setting.get('zoomStep');
    const prevZoom = this.zoom;
    const zoom = Math.max(
      remainDecimal(prevZoom * (1 - zoomStep)),
      this.editor.setting.get('zoomMin'),
    );

    this.setZoom(zoom);
    this.adjustScroll(cx, cy, prevZoom);
  }
  reset() {
    this.setZoom(1);
    const viewportManager = this.editor.viewportManager;
    const viewport = viewportManager.getViewport();
    viewportManager.setViewport({
      x: -viewport.width / 2,
      y: -viewport.height / 2,
    });
  }
  zoomToFit() {
    const viewport = this.editor.viewportManager.getViewport();
    const bboxs = this.editor.sceneGraph.children.map((item) => item.getBBox());

    if (bboxs.length === 0) {
      this.reset();
      return;
    }

    const composedBBox = getRectsBBox(...bboxs);

    const padding = this.editor.setting.get('zoomToFixPadding');
    // TODO:
    // const rulerWidth = this.editor.setting.get('enableRuler')
    //   ? this.editor.setting.get('rulerWidth')
    //   : 0;
    // const leftPadding = rulerWidth + padding;
    // const topPadding = rulerWidth + padding;

    let vh = viewport.height - padding * 2;
    if (vh <= 0) {
      vh = viewport.height;
    }
    let vw = viewport.width - padding * 2;
    if (vw <= 0) {
      vw = viewport.width;
    }

    let newZoom: number;
    const viewportRatio = vw / vh;
    const bboxRatio = composedBBox.width / composedBBox.height;
    if (viewportRatio > bboxRatio) {
      // basic height
      newZoom = vh / composedBBox.height;
    } else {
      newZoom = vw / composedBBox.width;
    }

    const newViewportX =
      composedBBox.x - (viewport.width / newZoom - composedBBox.width) / 2;
    const newViewportY =
      composedBBox.y - (viewport.height / newZoom - composedBBox.height) / 2;

    this.setZoom(newZoom);
    this.editor.viewportManager.setViewport({
      x: newViewportX,
      y: newViewportY,
    });
  }
  getCanvasCenter() {
    const { width, height } = this.editor.viewportManager.getViewport();
    return {
      x: width / 2,
      y: height / 2,
    };
  }
  /**
   * adjust scroll value
   * if no set (cx, cy), scale by canvas center
   */
  adjustScroll(
    cx: number | undefined,
    cy: number | undefined,
    prevZoom: number,
  ) {
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

    const { x: sceneX, y: sceneY } = viewportCoordsToSceneUtil(
      _cx,
      _cy,
      prevZoom,
      scrollX,
      scrollY,
    );
    const newScrollX = sceneX - _cx / zoom;
    const newScrollY = sceneY - _cy / zoom;

    viewportManager.setViewport({
      x: newScrollX,
      y: newScrollY,
    });
  }
  on(
    eventName: 'zoomChange',
    handler: (zoom: number, prevZoom: number) => void,
  ) {
    this.eventEmitter.on(eventName, handler);
  }
  off(
    eventName: 'zoomChange',
    handler: (zoom: number, prevZoom: number) => void,
  ) {
    this.eventEmitter.off(eventName, handler);
  }
}
