import { type Editor } from '../editor';
import { type Graph } from '../graphs';
import { type ICommand } from './type';

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
