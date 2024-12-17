import { EventEmitter, viewportCoordsToSceneUtil } from '@suika/common';
import { boxToRect, type IPoint, type IRect } from '@suika/geo';

import { type SuikaEditor } from './editor';
import { type SuikaGraphics } from './graphics';

interface IZoomOptions {
  center?: IPoint;
  isLevelZoom?: boolean;
  deltaY?: number;
}

interface Events {
  zoomChange(zoom: number, prevZoom: number): void;
}

export class ZoomManager {
  private zoom = 1;
  private eventEmitter = new EventEmitter<Events>();
  constructor(private editor: SuikaEditor) {}
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
  zoomIn(opts?: IZoomOptions) {
    const prevZoom = this.zoom;

    let zoom: number;
    if (opts?.isLevelZoom) {
      const levels = this.editor.setting.get('zoomLevels');
      const [, right] = getNearestVals(levels, prevZoom);
      zoom = right;
    } else {
      const zoomStep = opts?.deltaY
        ? this.deltaYToZoomStep(opts.deltaY)
        : this.editor.setting.get('zoomStep');
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
  zoomOut(opts?: IZoomOptions) {
    const prevZoom = this.zoom;
    let zoom: number;
    if (opts?.isLevelZoom) {
      const levels = this.editor.setting.get('zoomLevels');
      const [left] = getNearestVals(levels, prevZoom);
      zoom = left;
    } else {
      const zoomStep = opts?.deltaY
        ? this.deltaYToZoomStep(opts.deltaY)
        : this.editor.setting.get('zoomStep');
      zoom = Math.max(
        prevZoom / (1 + zoomStep),
        this.editor.setting.get('zoomMin'),
      );
    }

    this.setZoom(zoom);
    this.adjustScroll(prevZoom, opts?.center);
  }

  private deltaYToZoomStep(deltaY: number) {
    return Math.max(0.05, 0.12937973 * Math.log(Math.abs(deltaY)) - 0.33227472);
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
  private zoomRectToFit(rect: IRect, maxZoom?: number) {
    const { setting, viewportManager } = this.editor;
    const padding = setting.get('zoomToFixPadding');
    const viewport = viewportManager.getViewport();
    const rulerWidth = this.editor.setting.get('enableRuler')
      ? this.editor.setting.get('rulerWidth')
      : 0;

    const calculateDimension = (dimension: number): number => {
      const adjustedDimension = dimension - padding * 2 - rulerWidth;
      return adjustedDimension > 0 ? adjustedDimension : dimension;
    };

    const vh = calculateDimension(viewport.height);
    const vw = calculateDimension(viewport.width);

    const viewportRatio = vw / vh;
    const bboxRatio = rect.width / rect.height;

    let newZoom =
      viewportRatio > bboxRatio ? vh / rect.height : vw / rect.width;
    newZoom = maxZoom ? Math.min(newZoom, maxZoom) : newZoom;

    const newViewportX =
      rect.x - ((viewport.width + rulerWidth) / newZoom - rect.width) / 2;
    const newViewportY =
      rect.y - ((viewport.height + rulerWidth) / newZoom - rect.height) / 2;

    this.setZoom(newZoom);
    viewportManager.setViewport({ x: newViewportX, y: newViewportY });
  }
  /**
   * zoom to selection
   */
  zoomToSelection() {
    const selectedBoundingRect = this.editor.selectedElements.getBoundingRect();
    if (!selectedBoundingRect) {
      this.zoomToFit();
    } else {
      this.zoomRectToFit(selectedBoundingRect);
    }
  }

  /**
   * zoom to graphics
   */
  zoomToGraphics(graphics: SuikaGraphics) {
    const rect = boxToRect(graphics.getBbox());
    this.zoomRectToFit(rect);
  }

  /**
   * zoom to fit all elements
   * reference: https://mp.weixin.qq.com/s/XtNEl1dWCYkTIKStne4A4w
   */
  zoomToFit(maxZoom?: number) {
    const canvasBbox = this.editor.getCanvasBbox();
    if (!canvasBbox) {
      this.reset();
      return;
    }
    this.zoomRectToFit(boxToRect(canvasBbox), maxZoom);
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
  private adjustScroll(prevZoom: number, center?: IPoint) {
    const viewportManager = this.editor.viewportManager;
    const zoom = this.zoom;

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

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
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
