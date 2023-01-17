import { Editor } from '../editor';
import { ICommand } from './type';


export class CommandManager {
  redoStack: ICommand[] = [];
  undoStack: ICommand[] = [];

  constructor(private editor: Editor) {}

  redo() {
    if (this.redoStack.length > 0) {
      const command = this.redoStack.pop()!;
      this.undoStack.push(command);
      command.redo();

      this.editor.selectedElements.clear();
      this.editor.sceneGraph.render();
    }
  }
  undo() {
    if (this.undoStack.length > 0) {
      const command = this.undoStack.pop()!;
      this.redoStack.push(command);
      command.undo();

      this.editor.selectedElements.clear();
      this.editor.sceneGraph.render();
    }
  }
  pushCommand(cmd: ICommand) {
    this.undoStack.push(cmd);
    this.redoStack = [];
  }
}
