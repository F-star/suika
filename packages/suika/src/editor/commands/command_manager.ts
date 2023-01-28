import { Editor } from '../editor';
import { ICommand } from './type';

export class CommandManager {
  redoStack: ICommand[] = [];
  undoStack: ICommand[] = [];
  private isEnableRedoUndo = true;

  constructor(private editor: Editor) {}

  redo() {
    if (!this.isEnableRedoUndo) {
      return;
    }
    if (this.redoStack.length > 0) {
      const command = this.redoStack.pop()!;
      console.log(
        `%c Redo %c ${command.desc}`,
        'background: #f04; color: #ee0',
        ''
      );
      this.undoStack.push(command);
      command.redo();

      this.editor.sceneGraph.render();
    }
  }
  undo() {
    if (!this.isEnableRedoUndo) {
      return;
    }
    if (this.undoStack.length > 0) {
      const command = this.undoStack.pop()!;
      console.log(
        `%c Undo %c ${command.desc}`,
        'background: #40f; color: #eee',
        ''
      );
      this.redoStack.push(command);
      command.undo();

      this.editor.sceneGraph.render();
    }
  }
  enableRedoUndo() {
    this.isEnableRedoUndo = true;
  }
  disableRedoUndo() {
    this.isEnableRedoUndo = false;
  }
  pushCommand(command: ICommand) {
    console.log(
      `%c Exec %c ${command.desc}`,
      'background: #222; color: #bada55',
      ''
    );
    this.undoStack.push(command);
    this.redoStack = [];
  }
}
