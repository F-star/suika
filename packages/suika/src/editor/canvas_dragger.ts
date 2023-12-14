import { IPoint } from '@suika/geo';
import { Editor } from './editor';

/**
 * drag canvas
 * (update viewport position)
 */
export class CanvasDragger {
  private _active = false;
  private inactiveAfterPointerUp = false;
  private isEnableDragCanvasBySpace = true;

  private isPressing = false;
  private isDragging = false;
  private startPoint: IPoint = { x: 0, y: 0 };
  private startViewportPos: IPoint = { x: 0, y: 0 };

  private handleSpaceToggle = (isPressing: boolean) => {
    if (!this.isEnableDragCanvasBySpace) return;
    if (isPressing) {
      this.active();
    } else {
      this.inactive();
    }
  };

  constructor(private editor: Editor) {
    this.editor.hostEventManager.on('spaceToggle', this.handleSpaceToggle);
  }

  isActive() {
    return this._active;
  }

  active() {
    if (this._active) {
      console.warn('CanvasDragger already active');
      return;
    }
    this._active = true;
    this.editor.setCursor('grab');
    this.bindEvent();
  }

  private bindEvent() {
    const canvas = this.editor.canvasElement;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  inactive() {
    if (this.isPressing) {
      this.inactiveAfterPointerUp = true;
    } else {
      if (!this._active) {
        // console.warn('CanvasDragger already inactive');
        return;
      }
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

    this.isPressing = true;
    this.startPoint = this.editor.getCursorXY(e);
    this.startViewportPos = this.editor.viewportManager.getViewport();
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isPressing) return;
    const point: IPoint = this.editor.getCursorXY(e);
    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const zoom = this.editor.zoomManager.getZoom();
    const dragBlockStep = this.editor.setting.get('dragBlockStep') * zoom;
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
      this.editor.sceneGraph.render();
    }
  };

  private handlePointerUp = () => {
    this.editor.cursorManager.setCursor('grab');
    this.isDragging = false;
    this.isPressing = false;
    if (this.inactiveAfterPointerUp) {
      this.inactiveAfterPointerUp = false;
      this.inactive();
    }
  };

  destroy() {
    this.editor.hostEventManager.off('spaceToggle', this.handleSpaceToggle);
    this.unbindEvent();
  }
}
