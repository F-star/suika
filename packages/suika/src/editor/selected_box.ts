import { IPoint, IRectWithRotation, isPointInRect } from '@suika/geo';
import { Editor } from './editor';
import { getRectCenterPoint } from '../utils/geo';
import { rotateInCanvas } from '../utils/canvas';
import { EventEmitter } from '@suika/common';

interface Events {
  hoverChange(isHover: boolean): void;
}

export class SelectedBox {
  private box: IRectWithRotation | null = null;
  private eventEmitter = new EventEmitter<Events>();
  private _hover = false;

  constructor(private editor: Editor) {}

  isHover() {
    return this._hover;
  }

  getBox(): IRectWithRotation | null {
    return this.box ? { ...this.box } : null;
  }

  updateBbox() {
    const selectedElements = this.editor.selectedElements;

    let selectedRect: IRectWithRotation | null = null;
    const selectedSize = selectedElements.size();
    if (selectedSize > 0) {
      if (selectedSize === 1) {
        const selectedGraph = selectedElements.getItems()[0];
        selectedRect = selectedGraph.getRectWithRotation();
      } else {
        selectedRect = selectedElements.getBBox();
      }
    }
    this.box = selectedRect;

    return selectedRect;
  }

  draw() {
    const bBox = this.box;
    if (!bBox) {
      return;
    }

    const zoom = this.editor.zoomManager.getZoom();
    const ctx = this.editor.ctx;

    const stroke = this.editor.setting.get('guideBBoxStroke');

    ctx.save();
    ctx.strokeStyle = stroke;
    const { x: xInViewport, y: yInViewport } =
      this.editor.sceneCoordsToViewport(bBox.x, bBox.y);

    if (bBox.rotation) {
      const [cx, cy] = getRectCenterPoint(bBox);
      const { x: cxInViewport, y: cyInViewport } =
        this.editor.sceneCoordsToViewport(cx, cy);
      rotateInCanvas(ctx, bBox.rotation, cxInViewport, cyInViewport);
    }

    ctx.strokeRect(
      xInViewport,
      yInViewport,
      bBox.width * zoom,
      bBox.height * zoom,
    );

    ctx.restore();
  }

  isPointInBox(point: IPoint) {
    if (!this.box) {
      return false;
    }
    const TOL = 2;
    return isPointInRect(
      point,
      this.box,
      TOL / this.editor.zoomManager.getZoom(),
    );
  }

  setHover(hover: boolean) {
    if (this._hover === hover) {
      return;
    }
    this._hover = hover;
    this.eventEmitter.emit('hoverChange', hover);
  }

  setHoverByPoint(point: IPoint) {
    const hover = this.isPointInBox(point);
    this.setHover(hover);
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}
