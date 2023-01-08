import { IPoint } from '../../../type.interface';
import { getRectByTwoCoord } from '../../../utils/graphics';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';

/**
 * 绘制选区
 */
export class DrawSelectionBox implements IBaseTool {
  lastPointer: IPoint = { x: -1, y: -1 };
  startPoints: IPoint[] = [];

  constructor(private editor: Editor) {}
  active() {
    // do nothing
  }
  inactive() {
    // do nothing
  }
  start(e: PointerEvent) {
    this.lastPointer = this.editor.viewportCoordsToScene(e.clientX, e.clientY);

    this.editor.selectedElements.clear();
    this.editor.sceneGraph.render();
    // 设置选区
    this.editor.sceneGraph.setSelection(this.lastPointer);
  }
  drag(e: PointerEvent) {
    const pointer = this.editor.viewportCoordsToScene(e.clientX, e.clientY);

    const box = getRectByTwoCoord(this.lastPointer, pointer);

    this.editor.sceneGraph.setSelection(box);
    this.editor.sceneGraph.render();
  }
  end() {
    const elements = this.editor.sceneGraph.getElementsInSelection();

    this.editor.selectedElements.setItems(elements);
    this.editor.sceneGraph.selection = null;
    this.editor.sceneGraph.render();
  }
}
