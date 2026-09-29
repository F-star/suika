import { type SuikaEditor } from '../editor';
import { BaseCommand } from './base_command';

export class SelectCmd extends BaseCommand {
  constructor(
    desc: string,
    private editor: SuikaEditor,
    private params: {
      items: Set<string>;
      prevItems: Set<string>;
    },
  ) {
    super(desc);
  }

  redo() {
    this.editor.selectedElements.setItemsById(this.params.items);
  }
  undo() {
    this.editor.selectedElements.setItemsById(this.params.prevItems);
  }
}
