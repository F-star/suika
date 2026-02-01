import { type SuikaEditor } from '../editor';
import { type ICommand } from './type';

export class SelectCmd implements ICommand {
  constructor(
    public desc: string,
    private editor: SuikaEditor,
    private params: {
      items: Set<string>;
      prevItems: Set<string>;
    },
  ) {}

  redo() {
    this.editor.selectedElements.setItemsById(this.params.items);
  }
  undo() {
    this.editor.selectedElements.setItemsById(this.params.prevItems);
  }
}
