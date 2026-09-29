import { type SuikaEditor } from '../editor';
import { BaseCommand } from './base_command';

export class SwitchCurrentCanvasCmd extends BaseCommand {
  constructor(
    desc: string,
    private editor: SuikaEditor,
    private params: {
      id: string;
      prevId: string;
    },
  ) {
    super(desc);
  }
  redo() {
    this.editor.doc.setCurrentCanvas(this.params.id);
  }
  undo() {
    this.editor.doc.setCurrentCanvas(this.params.prevId);
  }
}
