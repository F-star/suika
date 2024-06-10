import { type ICommand } from './type';

export class MacroCmd implements ICommand {
  constructor(public desc: string, private cmds: ICommand[]) {}

  redo() {
    for (const cmd of this.cmds) {
      cmd.redo();
    }
  }
  undo() {
    for (let i = this.cmds.length - 1; i >= 0; i--) {
      this.cmds[i].undo();
    }
  }
}
