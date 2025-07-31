import { type SuikaEditor } from '../editor';
import { type ICommand } from './type';

export class SwitchCurrentCanvasCmd implements ICommand {
  constructor(
    public desc: string,
    private editor: SuikaEditor,
    private params: {
      id: string;
      prevId: string;
    },
  ) {}
  redo() {
    this.editor.doc.setCurrentCanvas(this.params.id);
  }
  undo() {
    this.editor.doc.setCurrentCanvas(this.params.prevId);
  }
}
