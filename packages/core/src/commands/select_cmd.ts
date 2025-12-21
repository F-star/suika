import { type SuikaEditor } from '../editor';
import { type SuikaGraphics } from '../graphics';
import { type ICommand } from './type';

export class SelectCmd implements ICommand {
  constructor(
    public desc: string,
    private editor: SuikaEditor,
    private params: {
      items: SuikaGraphics[];
      prevItems: SuikaGraphics[];
    },
  ) {}

  redo() {
    this.editor.selectedElements.setItems(this.params.items);
  }
  undo() {
    this.editor.selectedElements.setItems(this.params.prevItems);
  }
}
