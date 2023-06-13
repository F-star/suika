import { IPoint } from '../../../type.interface';
import { getRectByTwoCoord } from '../../../utils/graphics';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';

/**
 * 绘制选区
 */
export class DrawSelectionBox implements IBaseTool {
  private lastPointer: IPoint = { x: -1, y: -1 };
  private isShiftPressingWhenStart = false;

  constructor(private editor: Editor) {}
  active() {
    // do nothing
  }
  inactive() {
    // do nothing
  }
  start(e: PointerEvent) {
    this.isShiftPressingWhenStart = false;

    if (this.editor.hostEventManager.isShiftPressing) {
      this.isShiftPressingWhenStart = true;
    } else {
      this.editor.selectedElements.clear();
    }

    const pos = this.editor.getCursorXY(e);
    this.lastPointer = this.editor.viewportCoordsToScene(pos.x, pos.y);

    this.editor.sceneGraph.render();
    // 设置选区
    this.editor.sceneGraph.setSelection(this.lastPointer);
  }
  drag(e: PointerEvent) {
    const pos = this.editor.getCursorXY(e);
    const pointer = this.editor.viewportCoordsToScene(pos.x, pos.y);

    const box = getRectByTwoCoord(this.lastPointer, pointer);

    this.editor.sceneGraph.setSelection(box);
    this.editor.sceneGraph.render();
  }
  end() {
    const elements = this.editor.sceneGraph.getElementsInSelection();

    if (this.isShiftPressingWhenStart) {
      this.editor.selectedElements.toggleItems(elements);
    } else {
      this.editor.selectedElements.setItems(elements);
    }
  }
  afterEnd() {
    this.isShiftPressingWhenStart = false;
    this.editor.sceneGraph.selection = null;
    this.editor.sceneGraph.render();
  }
}
