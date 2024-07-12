import { type SuikaEditor } from '../editor';
import { type SuikaGraphics } from '../graphs';
import { type ICommand } from './type';

export class AddGraphCmd implements ICommand {
  constructor(
    public desc: string,
    private editor: SuikaEditor,
    private elements: SuikaGraphics[],
  ) {}
  redo() {
    for (const el of this.elements) {
      el.setDeleted(false);
      const parent = el.getParent();
      if (parent) {
        parent.insertChild(el, el.attrs.parentIndex?.position);
      }
    }

    this.editor.selectedElements.setItems(this.elements);
  }
  undo() {
    this.elements.forEach((el) => {
      el.setDeleted(true);
      el.removeFromParent();
    });

    this.editor.selectedElements.clear();
  }
}
