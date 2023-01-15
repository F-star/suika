import { Graph } from '../../scene/graph';
import { IPoint } from '../../type.interface';
import { noop } from '../../utils/common';
import { normalizeRect } from '../../utils/graphics';
import { Editor } from '../editor';
import { ITool } from './type';

export abstract class DrawShapeTool implements ITool {
  static type = 'drawShape';
  type = 'drawRect';
  ShapeCtor: typeof Graph = Graph;

  startPointer: IPoint = { x: -1, y: -1 };
  lastDragPointer!: IPoint;
  lastDragPointerInViewport!: IPoint;
  drawingShape: Graph | null = null;

  isDragging = false;
  unbindEvent: () => void = noop;

  constructor(private editor: Editor) {}
  active() {
    const editor = this.editor;
    editor.setCursor('crosshair');

    const hotkeysManager = editor.hostEventManager;
    const updateRectWhenShiftToggle = () => {
      if (this.isDragging) {
        this.updateRect();
      }
    };
    hotkeysManager.on('shiftToggle', updateRectWhenShiftToggle);

    const updateRectWhenViewportTranslate = () => {
      if (editor.hostEventManager.isDraggingCanvasBySpace) {
        return;
      }
      if (this.isDragging) {
        this.lastDragPointer = editor.viewportCoordsToScene(
          this.lastDragPointerInViewport.x,
          this.lastDragPointerInViewport.y
        );
        this.updateRect();
      }
    };
    editor.viewportManager.on('xOrYChange', updateRectWhenViewportTranslate);

    this.unbindEvent = () => {
      hotkeysManager.off('shiftToggle', updateRectWhenShiftToggle);
      editor.viewportManager.off('xOrYChange', updateRectWhenViewportTranslate);
    };
  }
  inactive() {
    this.editor.setCursor('');

    this.unbindEvent();
  }
  moveExcludeDrag() {
    // do nothing;
  }
  start(e: PointerEvent) {
    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }
    const pos = this.editor.getPointerXY(e);
    this.startPointer = this.editor.viewportCoordsToScene(pos.x, pos.y);
    this.drawingShape = null;
    this.isDragging = false;
  }
  drag(e: PointerEvent) {
    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }
    this.isDragging = true;
    this.lastDragPointerInViewport = this.editor.getPointerXY(e);
    const pos = this.editor.getPointerXY(e);
    this.lastDragPointer = this.editor.viewportCoordsToScene(
      pos.x,
      pos.y,
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
    if (this.editor.hostEventManager.isShiftPressing) {
      if (Math.abs(width) > Math.abs(height)) {
        rect.height = Math.sign(height) * Math.abs(width);
      } else {
        rect.width = Math.sign(width) * Math.abs(height);
      }
    }

    rect = normalizeRect(rect);

    if (this.drawingShape) {
      this.drawingShape.x = rect.x;
      this.drawingShape.y = rect.y;
      this.drawingShape.width = rect.width;
      this.drawingShape.height = rect.height;
    } else {
      const element = new this.ShapeCtor({
        ...rect,
        fill: this.editor.setting.fill,
      });
      sceneGraph.appendChild(element);

      this.drawingShape = element;
    }
    this.editor.selectedElements.setItems([this.drawingShape]);
    sceneGraph.render();
  }
  end(e: PointerEvent) {
    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }
    this.isDragging = false;

    const pos = this.editor.getPointerXY(e);
    const endPointer = this.editor.viewportCoordsToScene(pos.x, pos.y);
    if (this.drawingShape === null) {
      const { x: cx, y: cy } = endPointer;
      const width = this.editor.setting.drawRectDefaultWidth;
      const height = this.editor.setting.drawRectDefaultHeight;

      this.drawingShape = new this.ShapeCtor({
        x: cx - width / 2,
        y: cy - height / 2,
        width,
        height,
        fill: this.editor.setting.fill,
      });
      this.editor.sceneGraph.appendChild(this.drawingShape);

      this.editor.selectedElements.setItems([this.drawingShape]);
      this.editor.sceneGraph.render();
    }

    this.editor.commandManger.execCmd('AddShape', this.drawingShape);
    this.editor.toolManager.setTool('select');
  }
}
