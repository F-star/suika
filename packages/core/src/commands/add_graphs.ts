import { Editor } from '../editor';
import { Graph } from '../graphs';
import { ICommand } from './type';

export class AddGraphCmd implements ICommand {
  constructor(
    public desc: string,
    private editor: Editor,
    private elements: Graph[],
  ) {}
  redo() {
    this.editor.sceneGraph.addItems(this.elements);
    this.editor.selectedElements.setItems(this.elements);
  }
  undo() {
    this.editor.sceneGraph.removeItems(this.elements);
    this.editor.selectedElements.clear();
  }
}
