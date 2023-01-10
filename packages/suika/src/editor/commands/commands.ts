import { Editor } from '../editor';
import { AddShapeCommand } from './draw_shape';
import { MoveElementsCommand } from './move_elements';
import { ICommand } from './type';

type ICmdName = 'AddShape';

export class CommandManger {
  redoStack: ICommand[] = [];
  undoStack: ICommand[] = [];
  map: { [cmdName: string]: new (...args: any) => any };

  constructor(private editor: Editor) {
    this.map = {
      [AddShapeCommand.type]: AddShapeCommand,
      [MoveElementsCommand.type]: MoveElementsCommand,
    };
  }

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
  execCmd(cmdName: ICmdName, ...options: any[]) {
    const Ctor = this.map[cmdName];

    const cmd = new Ctor(this.editor.sceneGraph, ...options);
    this.undoStack.push(cmd);
    this.redoStack = [];
  }
}
