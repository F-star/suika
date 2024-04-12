import { EventEmitter, viewportCoordsToSceneUtil } from '@suika/common';
import { type IPoint, mergeRect } from '@suika/geo';

import { type Editor } from './editor';
import { type IBox } from './type';

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
    this.adjustScroll(prevZoom);
  }
  /**
   * zoom in
   * reference: https://mp.weixin.qq.com/s/UDnIxjYEsTop51gW7fwxMw
   * @param center zoom center
   * @param enableLevel zoom by level
   */
  zoomIn(opts?: { center?: IPoint; enableLevel?: boolean }) {
    const zoomStep = this.editor.setting.get('zoomStep');
    const prevZoom = this.zoom;

    let zoom: number;
    if (opts?.enableLevel) {
      const levels = this.editor.setting.get('zoomLevels');
      const [, right] = getNearestVals(levels, prevZoom);
      zoom = right;
    } else {
      zoom = Math.min(
        prevZoom * (1 + zoomStep),
        this.editor.setting.get('zoomMax'),
      );
    }

    this.setZoom(zoom);
    this.adjustScroll(prevZoom, opts?.center);
  }
  /**
   * zoom out
   * reference: https://mp.weixin.qq.com/s/UDnIxjYEsTop51gW7fwxMw
   * @param center zoom center
   * @param enableLevel zoom by level
   */
  zoomOut(opts?: { center?: IPoint; enableLevel?: boolean }) {
    const zoomStep = this.editor.setting.get('zoomStep');
    const prevZoom = this.zoom;
    let zoom: number;
    if (opts?.enableLevel) {
      const levels = this.editor.setting.get('zoomLevels');
      const [left] = getNearestVals(levels, prevZoom);
      zoom = left;
    } else {
      zoom = Math.max(
        prevZoom / (1 + zoomStep),
        this.editor.setting.get('zoomMin'),
      );
    }

    this.setZoom(zoom);
    this.adjustScroll(prevZoom, opts?.center);
  }
  /**
   * make origin in viewport center
   * and set zoom 100%
   */
  reset() {
    this.setZoom(1);
    const viewportManager = this.editor.viewportManager;
    const viewport = viewportManager.getViewport();
    viewportManager.setViewport({
      x: -viewport.width / 2,
      y: -viewport.height / 2,
    });
  }
  private zoomBoxToFit(composedBBox: IBox, maxZoom?: number) {
    const padding = this.editor.setting.get('zoomToFixPadding');
    const viewport = this.editor.viewportManager.getViewport();

    // TODO: consider padding from ruler
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

    if (maxZoom && newZoom > maxZoom) {
      newZoom = maxZoom;
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
  zoomToSelection() {
    const selectionBox = this.editor.selectedElements.getBbox();
    if (!selectionBox) {
      this.zoomToFit();
    } else {
      this.zoomBoxToFit(selectionBox);
    }
  }
  /**
   * zoom to fit all elements
   * reference: https://mp.weixin.qq.com/s/XtNEl1dWCYkTIKStne4A4w
   */
  zoomToFit(maxZoom?: number) {
    const visibleGraphs = this.editor.sceneGraph.getVisibleItems();
    if (visibleGraphs.length === 0) {
      this.reset();
      return;
    }
    const bboxs = visibleGraphs.map((item) => item.getBbox());
    this.zoomBoxToFit(mergeRect(...bboxs), maxZoom);
  }
  private getCanvasCenter() {
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
  adjustScroll(prevZoom: number, center?: IPoint) {
    const viewportManager = this.editor.viewportManager;
    const zoom = this.editor.zoomManager.getZoom();

    const { x: scrollX, y: scrollY } = viewportManager.getViewport();

    if (!center) {
      center = this.getCanvasCenter();
    }

    const { x: sceneX, y: sceneY } = viewportCoordsToSceneUtil(
      center.x,
      center.y,
      prevZoom,
      scrollX,
      scrollY,
    );
    const newScrollX = sceneX - center.x / zoom;
    const newScrollY = sceneY - center.y / zoom;

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

/**
 * binary search to find
 * the left and right index of the target value
 */
const getNearestVals = <T>(arr: T[], target: T): [T, T] => {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      right = mid - 1;
      left = mid + 1;
      break;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  if (right < 0) right = 0;
  if (left >= arr.length) left = arr.length - 1;
  return [arr[right], arr[left]];
};
