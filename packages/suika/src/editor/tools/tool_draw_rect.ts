import { Rect } from '../../scene/rect';
import { IPoint } from '../../type.interface';
import { getRectByTwoCoord } from '../../utils/graphics';
import { Editor } from '../editor';
import { ITool } from './type';

export class DrawRectTool implements ITool {
  static type = 'drawRect';
  type = 'drawRect';
  lastPointer: IPoint = { x: -1, y: -1 };
  drawingRect: Rect | null = null;

  constructor(private editor: Editor) {}
  active() {
    this.editor.canvasElement.style.cursor = 'crosshair';
  }
  inactive() {
    this.editor.canvasElement.style.cursor = '';
  }
  start(e: PointerEvent) {
    this.lastPointer = this.editor.viewportCoordsToScene(e.clientX, e.clientY);
    this.drawingRect = null;
  }
  drag(e: PointerEvent) {
    const pointer: IPoint = this.editor.viewportCoordsToScene(
      e.clientX,
      e.clientY,
    );
    // 拖拽
    const sceneGraph = this.editor.sceneGraph;
    const lastPointer = this.lastPointer;

    const rect = getRectByTwoCoord(lastPointer, pointer);
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
