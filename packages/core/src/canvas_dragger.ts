import { EventEmitter } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { type SuikaEditor } from './editor';
import { type IMouseEvent, type IMousemoveEvent } from './host_event_manager';

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
  private startVwPos: IPoint = { x: 0, y: 0 };
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

  constructor(private editor: SuikaEditor) {
    this.editor.hostEventManager.on('spaceToggle', this.handleSpaceToggle);
    this.editor.mouseEventManager.on(
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
    this.bindEventWhenActive();
    if (event) {
      this.editor.setCursor('grabbing');
      const vwPos = this.editor.getCursorXY(event);
      this.onStart({
        pos: this.editor.toScenePt(vwPos.x, vwPos.y),
        vwPos,
        nativeEvent: event,
      });
    }
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
      this.unbindEventWhenInactive();
      this.editor.toolManager.setCursorWhenActive();
    }
  }

  enableDragBySpace() {
    this.isEnableDragCanvasBySpace = true;
  }
  disableDragBySpace() {
    this.isEnableDragCanvasBySpace = false;
  }

  private onStart = (event: IMouseEvent) => {
    if (event.nativeEvent.button !== 0 && event.nativeEvent.button !== 1) {
      return;
    }
    this.editor.cursorManager.setCursor('grabbing');

    this._isPressing = true;
    this.startVwPos = { ...event.vwPos };
    this.startViewportPos = this.editor.viewportManager.getViewport();
  };

  private onDrag = (event: IMousemoveEvent) => {
    if (!this._isPressing) return;
    const dx = event.vwPos.x - this.startVwPos.x;
    const dy = event.vwPos.y - this.startVwPos.y;

    const dragBlockStep = this.editor.setting.get('dragBlockStep');

    const zoom = this.editor.zoomManager.getZoom();
    if (event.maxDragDistance > dragBlockStep / zoom) {
      const viewportX = this.startViewportPos.x - dx / zoom;
      const viewportY = this.startViewportPos.y - dy / zoom;
      this.editor.viewportManager.setViewport({ x: viewportX, y: viewportY });
      this.editor.render();
    }
  };

  private onEnd = () => {
    this.editor.cursorManager.setCursor('grab');
    this._isPressing = false;
    if (this.inactiveAfterPointerUp) {
      this.inactiveAfterPointerUp = false;
      this.inactive();
    }
  };

  private bindEventWhenActive() {
    this.editor.mouseEventManager.on('start', this.onStart);
    this.editor.mouseEventManager.on('drag', this.onDrag);
    this.editor.mouseEventManager.on('end', this.onEnd);
  }

  private unbindEventWhenInactive() {
    this.editor.mouseEventManager.off('start', this.onStart);
    this.editor.mouseEventManager.off('drag', this.onDrag);
    this.editor.mouseEventManager.off('end', this.onEnd);
  }

  destroy() {
    this.editor.hostEventManager.off('spaceToggle', this.handleSpaceToggle);
    this.editor.mouseEventManager.off(
      'wheelBtnToggle',
      this.handleWheelBtnToggle,
    );
    this.unbindEventWhenInactive();
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}
