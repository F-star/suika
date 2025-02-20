import { SuikaEditor } from '../editor';
import { ICommand } from './type';

export class SelectGraphicsCmd implements ICommand {
  static readonly type = 'SelectGraphics';
  constructor(
    public desc: string,
    private editor: SuikaEditor,
    private ids: Set<string>,
    private prevIds: Set<string>,
  ) {}

  redo() {
    this.editor.selectedElements.setItemsById(this.ids);
  }

  undo() {
    this.editor.selectedElements.setItemsById(this.prevIds);
  }
}
