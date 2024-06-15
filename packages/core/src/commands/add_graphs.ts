import { type Editor } from '../editor';
import { type SuikaGraphics } from '../graphs';
import { type ICommand } from './type';

export class AddGraphCmd implements ICommand {
  constructor(
    public desc: string,
    private editor: Editor,
    private elements: SuikaGraphics[],
  ) {}
  redo() {
    // TODO: 放回原来的 parent 下
    this.editor.sceneGraph.addItems(this.elements);
    for (const el of this.elements) {
      const parent = el.getParent();
      if (parent) {
        parent.insertChild(el, el.attrs.parentIndex?.position);
      }
    }

    this.editor.selectedElements.setItems(this.elements);
  }
  undo() {
    this.editor.sceneGraph.removeItems(this.elements);
    this.elements.forEach((el) => {
      const parent = el.getParent();
      if (parent) {
        parent.removeChild(el);
      }
    });

    this.editor.selectedElements.clear();
  }
}
