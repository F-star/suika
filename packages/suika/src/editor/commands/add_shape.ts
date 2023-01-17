import { Graph } from '../../scene/graph';
import { Editor } from '../editor';
import { ICommand } from './type';

/**
 * 创建矩形
 */
export class AddShapeCommand implements ICommand {
  idx = -1;

  constructor(private editor: Editor, private element: Graph) {}
  redo() {
    this.editor.sceneGraph.appendChild(this.element, this.idx);
    this.editor.selectedElements.setItems([this.element]);
  }
  undo() {
    this.idx = this.editor.sceneGraph.removeChild(this.element);
    this.editor.selectedElements.clear();
  }
}
