import hotkeys from 'hotkeys-js';
import { Rect } from '../../scene/rect';
import { IPoint } from '../../type.interface';
import { noop } from '../../utils/common';
import { normalizeRect } from '../../utils/graphics';
import { Editor } from '../editor';
import { ITool } from './type';

export class DrawRectTool implements ITool {
  static type = 'drawRect';
  type = 'drawRect';
  startPointer: IPoint = { x: -1, y: -1 };
  lastDragPointer!: IPoint;
  lastDragPointerInViewport!: IPoint;
  drawingRect: Rect | null = null;

  isDragging = false;
  unbindEvent: () => void = noop;

  updateRectWhenViewportTranslate = () => {
    if (this.editor.hotkeysManager.isDraggingCanvasBySpace) {
      return;
    }
    if (this.isDragging) {
      this.lastDragPointer = this.editor.viewportCoordsToScene(
        this.lastDragPointerInViewport.x,
        this.lastDragPointerInViewport.y
      );
      this.updateRect();
    }
  };

  constructor(private editor: Editor) {}
  active() {
    this.editor.canvasElement.style.cursor = 'crosshair';

    const handler = () => {
      if (this.isDragging && hotkeys.shift) {
        this.updateRect();
      }
    };
    hotkeys('*', { keydown: true, keyup: true }, handler);
    this.unbindEvent = () => {
      hotkeys.unbind('*', handler);
    };

    this.editor.viewportManager.on('xOrYChange', this.updateRectWhenViewportTranslate);
  }
  inactive() {
    this.editor.canvasElement.style.cursor = '';
    this.unbindEvent();
    this.editor.viewportManager.off('xOrYChange', this.updateRectWhenViewportTranslate);
  }
  start(e: PointerEvent) {
    if (this.editor.hotkeysManager.isDraggingCanvasBySpace) {
      return;
    }
    this.startPointer = this.editor.viewportCoordsToScene(e.clientX, e.clientY);
    this.drawingRect = null;
    this.isDragging = false;
  }
  drag(e: PointerEvent) {
    if (this.editor.hotkeysManager.isDraggingCanvasBySpace) {
      return;
    }
    this.isDragging = true;
    this.lastDragPointerInViewport = {
      x: e.clientX,
      y: e.clientY,
    };
    this.lastDragPointer = this.editor.viewportCoordsToScene(
      e.clientX,
      e.clientY
    );
    this.updateRect();
  }
  updateRect() {
    const { x, y } = this.lastDragPointer;
    const sceneGraph = this.editor.sceneGraph;
    const { x: startX, y: startY } = this.startPointer;

    const width = x - startX;
    const height = y - startY;

    let rect = {
      x: startX,
      y: startY,
      width,
      height,
    };

    // 按住 shift 绘制正方形
    if (this.editor.hotkeysManager.isShiftPressing) {
      if (Math.abs(width) > Math.abs(height)) {
        rect.height = Math.sign(height) * Math.abs(width);
      } else {
        rect.width = Math.sign(width) * Math.abs(height);
      }
    }

    rect = normalizeRect(rect);

    if (this.drawingRect) {
      this.drawingRect.x = rect.x;
      this.drawingRect.y = rect.y;
      this.drawingRect.width = rect.width;
      this.drawingRect.height = rect.height;
    } else {
      this.drawingRect = sceneGraph.addRect({
        ...rect,
        fill: this.editor.setting.fill,
      });
    }
    this.editor.selectedElements.setItems([this.drawingRect]);
    sceneGraph.render();
  }
  end(e: PointerEvent) {
    if (this.editor.hotkeysManager.isDraggingCanvasBySpace) {
      return;
    }
    this.isDragging = false;

    const endPointer = this.editor.viewportCoordsToScene(e.clientX, e.clientY);
    if (this.drawingRect === null) {
      const { x: cx, y: cy } = endPointer;
      const width = this.editor.setting.drawRectDefaultWidth;
      const height = this.editor.setting.drawRectDefaultHeight;

      this.drawingRect = this.editor.sceneGraph.addRect({
        x: cx - width / 2,
        y: cy - height / 2,
        width,
        height,
        fill: this.editor.setting.fill,
      });
      this.editor.selectedElements.setItems([this.drawingRect]);
      this.editor.sceneGraph.render();
    }

    this.editor.commandManger.execCmd('AddRect', this.drawingRect);
  }
}
