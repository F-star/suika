import { BaseCommand } from './base_command';
import { type ICommand } from './type';

export class MacroCmd extends BaseCommand {
  constructor(desc: string, private cmds: ICommand[]) {
    super(desc);
  }

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
