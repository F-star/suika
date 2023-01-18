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
  pushCommand(cmd: ICommand) {
    this.undoStack.push(cmd);
    this.redoStack = [];
  }
}
