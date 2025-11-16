import { EventEmitter, getDevicePixelRatio } from '@suika/common';
import {
  boxToRect,
  type IBox,
  type IPoint,
  type IRect,
  type ISize,
  Matrix,
} from '@suika/geo';

import { type SuikaEditor } from './editor';
import { type SuikaGraphics } from './graphics';

interface Events {
  xOrYChange(x: number | undefined, y: number): void;
  viewMatrixChange(viewMatrix: Matrix): void;
  zoomChange(zoom: number): void;
}

export class ViewportManager {
  private viewMatrix = new Matrix();
  private eventEmitter = new EventEmitter<Events>();

  constructor(private editor: SuikaEditor) {}

  /* get view matrix clone */
  getViewMatrix() {
    return this.viewMatrix.clone();
  }

  setViewMatrix(viewMatrix: Matrix) {
    const prevX = this.viewMatrix.tx;
    const prevY = this.viewMatrix.ty;
    const prevZoom = this.getZoom();
    this.viewMatrix = viewMatrix;
    this.eventEmitter.emit('viewMatrixChange', viewMatrix);

    if (prevZoom !== this.getZoom()) {
      this.eventEmitter.emit('zoomChange', this.getZoom());
    }
    if (prevX !== viewMatrix.tx || prevY !== viewMatrix.ty) {
      this.eventEmitter.emit('xOrYChange', viewMatrix.tx, viewMatrix.ty);
    }
  }

  getZoom() {
    return this.viewMatrix.a;
  }

  /**
   * zoom in
   * @param center zoom center
   * @param enableLevel zoom by level
   * @param deltaY mouse wheel deltaY
   */
  zoomIn(opts?: { center?: IPoint; isLevelZoom?: boolean; deltaY?: number }) {
    const prevZoom = this.getZoom();

    let zoom: number;
    if (opts?.isLevelZoom) {
      const levels = this.editor.setting.get('zoomLevels');
      const [, right] = getNearestVals(levels, prevZoom);
      zoom = right;
    } else {
      const zoomStep = opts?.deltaY
        ? deltaYToZoomStep(opts.deltaY)
        : this.editor.setting.get('zoomStep');
      zoom = Math.min(
        prevZoom * (1 + zoomStep),
        this.editor.setting.get('zoomMax'),
      );
    }

    const center = opts?.center ?? this.getViewportCenter();
    this.setZoom(zoom, center);
  }

  /**
   * zoom out
   * @param center zoom center
   * @param enableLevel zoom by level
   * @param deltaY mouse wheel deltaY
   */
  zoomOut(opts?: { center?: IPoint; isLevelZoom?: boolean; deltaY?: number }) {
    const prevZoom = this.getZoom();
    let zoom: number;
    if (opts?.isLevelZoom) {
      const levels = this.editor.setting.get('zoomLevels');
      const [left] = getNearestVals(levels, prevZoom);
      zoom = left;
    } else {
      const zoomStep = opts?.deltaY
        ? deltaYToZoomStep(opts.deltaY)
        : this.editor.setting.get('zoomStep');
      zoom = Math.max(
        prevZoom / (1 + zoomStep),
        this.editor.setting.get('zoomMin'),
      );
    }
    const center = opts?.center ?? this.getViewportCenter();
    this.setZoom(zoom, center);
  }

  setZoom(zoom: number, center: IPoint) {
    const deltaZoom = zoom / this.getZoom();
    const newViewMatrix = this.viewMatrix
      .clone()
      .translate(-center.x, -center.y)
      .scale(deltaZoom, deltaZoom)
      .translate(center.x, center.y);

    this.setViewMatrix(newViewMatrix);
    this.eventEmitter.emit('zoomChange', this.getZoom());
  }

  /** zoom to fit all elements */
  zoomToFit(maxZoom?: number) {
    const canvasBbox = this.editor.getCanvasChildrenBbox();
    if (!canvasBbox) {
      this.resetViewport();
      return;
    }
    this.zoomRectToFit(boxToRect(canvasBbox), maxZoom);
  }

  zoomToSelection() {
    const selectedBoundingRect = this.editor.selectedElements.getBoundingRect();
    if (!selectedBoundingRect) {
      this.zoomToFit();
    } else {
      this.zoomRectToFit(selectedBoundingRect);
    }
  }

  private zoomRectToFit(targetRect: IRect, maxZoom?: number) {
    const padding = this.editor.setting.get('zoomToFixPadding');
    const rulerWidth = this.editor.setting.get('enableRuler')
      ? this.editor.setting.get('rulerWidth')
      : 0;

    const pageSize = this.getPageSize();
    const targetCenter = {
      x: targetRect.x + targetRect.width / 2,
      y: targetRect.y + targetRect.height / 2,
    };

    const zoomX =
      (pageSize.width - padding * 2 - rulerWidth) / targetRect.width;
    const zoomY =
      (pageSize.height - padding * 2 - rulerWidth) / targetRect.height;
    let zoom = Math.min(zoomX, zoomY);

    if (maxZoom) {
      zoom = Math.min(zoom, maxZoom);
    }

    const newViewMatrix = new Matrix()
      .translate(-targetCenter.x, -targetCenter.y)
      .scale(zoom, zoom)
      .translate(pageSize.width / 2, pageSize.height / 2)
      .translate(rulerWidth / 2, rulerWidth / 2);

    this.setViewMatrix(newViewMatrix);
  }

  /**
   * make origin in viewport center
   * and set zoom 100%
   */
  resetViewport() {
    const center = this.getViewportCenter();
    const newViewMatrix = new Matrix().translate(center.x, center.y);
    this.setViewMatrix(newViewMatrix);
  }

  private getViewportCenter() {
    const { width, height } = this.getPageSize();
    return {
      x: width / 2,
      y: height / 2,
    };
  }

  zoomToGraphics(graphics: SuikaGraphics) {
    const rect = boxToRect(graphics.getBbox());
    this.zoomRectToFit(rect);
  }

  getPos() {
    return {
      x: this.viewMatrix.tx,
      y: this.viewMatrix.ty,
    };
  }

  getPageSize() {
    return {
      width: parseFloat(this.editor.canvasElement.style.width),
      height: parseFloat(this.editor.canvasElement.style.height),
    };
  }

  setViewportSize({ width, height }: ISize) {
    const dpr = getDevicePixelRatio();

    this.editor.canvasElement.width = width * dpr;
    this.editor.canvasElement.style.width = width + 'px';

    this.editor.canvasElement.height = height * dpr;
    this.editor.canvasElement.style.height = height + 'px';
  }
  getSceneCenter() {
    const size = this.getPageSize();
    return this.viewMatrix.applyInverse({
      x: size.width / 2,
      y: size.height / 2,
    });
  }
  translate(dx: number, dy: number) {
    const newViewMatrix = this.viewMatrix.clone().translate(dx, dy);
    this.setViewMatrix(newViewMatrix);
  }

  setZoomAndUpdateViewport(zoom: number) {
    const size = this.getPageSize();
    this.editor.viewportManager.setZoom(zoom, {
      x: size.width / 2,
      y: size.height / 2,
    });
  }

  getSceneBbox(): IBox {
    const { width, height } = this.getPageSize();
    const { x: minX, y: minY } = this.viewMatrix.applyInverse({ x: 0, y: 0 });
    const { x: maxX, y: maxY } = this.viewMatrix.applyInverse({
      x: width,
      y: height,
    });
    return { minX, minY, maxX, maxY };
  }

  toScenePt(point: IPoint, round = false) {
    const scenePt = this.viewMatrix.applyInverse(point);
    if (round) {
      scenePt.x = Math.round(scenePt.x);
      scenePt.y = Math.round(scenePt.y);
    }
    return scenePt;
  }

  toViewportPt(point: IPoint) {
    return this.viewMatrix.apply(point);
  }

  toSceneSize(size: number) {
    const zoom = this.getZoom();
    return size / zoom;
  }

  toViewportSize(size: number) {
    const zoom = this.getZoom();
    return size * zoom;
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

const deltaYToZoomStep = (deltaY: number) => {
  return Math.max(0.05, 0.12937973 * Math.log(Math.abs(deltaY)) - 0.33227472);
};
