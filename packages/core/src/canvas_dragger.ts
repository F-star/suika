import { EventEmitter } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { type Editor } from './editor';

interface Events {
  activeChange(active: boolean): void;
}

/**
 * drag canvas
 * (update viewport position)
 */
export class CanvasDragger {
  private _active = false;
  private inactiveAfterPointerUp = false;
  private isEnableDragCanvasBySpace = true;

  private _isPressing = false;
  private isDragging = false;
  private startPoint: IPoint = { x: 0, y: 0 };
  private startViewportPos: IPoint = { x: 0, y: 0 };

  private eventEmitter = new EventEmitter<Events>();

  isPressing() {
    return this._isPressing;
  }

  private handleSpaceToggle = (isSpacePressing: boolean) => {
    if (!this.isEnableDragCanvasBySpace) return;
    if (isSpacePressing) {
      this.active();
    } else {
      this.inactive();
    }
  };

  private handleWheelBtnToggle = (isPressing: boolean, event: PointerEvent) => {
    if (!this.isEnableDragCanvasBySpace) return;
    if (isPressing) {
      this.active(event);
    } else {
      this.inactive();
    }
  };

  constructor(private editor: Editor) {
    this.editor.hostEventManager.on('spaceToggle', this.handleSpaceToggle);
    this.editor.hostEventManager.on(
      'wheelBtnToggle',
      this.handleWheelBtnToggle,
    );
  }

  isActive() {
    return this._active;
  }

  /**
   * active canvas dragger
   * if event is not undefined, will active and start dragging immediately
   */
  active(event?: PointerEvent) {
    if (this._active) {
      console.warn('CanvasDragger already active');
      return;
    }
    this.eventEmitter.emit('activeChange', true);
    this._active = true;
    this.editor.setCursor('grab');
    this.bindEvent();
    if (event) {
      this.editor.setCursor('grabbing');
      this.handlePointerDown(event);
    }
  }

  private bindEvent() {
    const canvas = this.editor.canvasElement;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  inactive() {
    if (this._isPressing) {
      this.inactiveAfterPointerUp = true;
    } else {
      if (!this._active) {
        // console.warn('CanvasDragger already inactive');
        return;
      }
      this.eventEmitter.emit('activeChange', false);
      this._active = false;
      this.unbindEvent();
    }
  }

  private unbindEvent() {
    const canvas = this.editor.canvasElement;
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.editor.toolManager.setCursorWhenActive();
  }

  enableDragBySpace() {
    this.isEnableDragCanvasBySpace = true;
  }
  disableDragBySpace() {
    this.isEnableDragCanvasBySpace = false;
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (!(e.button === 0 || e.button === 1)) return;
    this.editor.cursorManager.setCursor('grabbing');

    this._isPressing = true;
    this.startPoint = this.editor.getCursorXY(e);
    this.startViewportPos = this.editor.viewportManager.getViewport();
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this._isPressing) return;
    const point: IPoint = this.editor.getCursorXY(e);
    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const zoom = this.editor.zoomManager.getZoom();
    const dragBlockStep = this.editor.setting.get('dragBlockStep');
    if (
      !this.isDragging &&
      (Math.abs(dx) > dragBlockStep || Math.abs(dy) > dragBlockStep)
    ) {
      this.isDragging = true;
    }

    if (this.isDragging) {
      const viewportX = this.startViewportPos.x - dx / zoom;
      const viewportY = this.startViewportPos.y - dy / zoom;
      this.editor.viewportManager.setViewport({ x: viewportX, y: viewportY });
      this.editor.render();
    }
  };

  private handlePointerUp = () => {
    this.editor.cursorManager.setCursor('grab');
    this.isDragging = false;
    this._isPressing = false;
    if (this.inactiveAfterPointerUp) {
      this.inactiveAfterPointerUp = false;
      this.inactive();
    }
  };

  destroy() {
    this.editor.hostEventManager.off('spaceToggle', this.handleSpaceToggle);
    this.editor.hostEventManager.off(
      'wheelBtnToggle',
      this.handleWheelBtnToggle,
    );
    this.unbindEvent();
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}
