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
  start(e: PointerEvent) {
    this.lastPointer = {
      x: e.clientX,
      y: e.clientY,
    };

    this.editor.selectedElements.clear();
    this.editor.sceneGraph.render();
    // 设置选区
    this.editor.sceneGraph.setSelection(this.lastPointer);
  }
  drag(e: PointerEvent) {
    const box = getRectByTwoCoord(this.lastPointer, {
      x: e.clientX,
      y: e.clientY,
    });

    this.editor.sceneGraph.setSelection(box);
    this.editor.sceneGraph.render();
  }
  end(e: PointerEvent) {
    const elements = this.editor.sceneGraph.getElementsInSelection();

    this.editor.selectedElements.setItems(elements);
    this.editor.sceneGraph.selection = null;
    this.editor.sceneGraph.render();
  }
}
