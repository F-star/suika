import { EventEmitter } from '@suika/common';

import { Editor } from '../editor';
import { ICommand } from './type';

export interface IHistoryStatus {
  canRedo: boolean;
  canUndo: boolean;
}

interface Events {
  change(status: IHistoryStatus): void;
  beforeExecCmd(): void;
}

interface ICommandItem {
  command: ICommand;
  /** consider the continue commands marked "isBatched" as one macro command */
  isBatched?: boolean;
  hooks?: {
    beforeRedo?: () => void;
    beforeUndo?: () => void;
  };
}

/**
 * Command Manager
 *
 * reference: https://mp.weixin.qq.com/s/JBhXeFPTw8O34vOtk05cQg
 */
export class CommandManager {
  redoStack: ICommandItem[] = [];
  undoStack: ICommandItem[] = [];
  private isEnableRedoUndo = true;
  private emitter = new EventEmitter<Events>();
  private isBatching = false;

  constructor(private editor: Editor) {}

  redo() {
    if (!this.isEnableRedoUndo) {
      return;
    }
    if (this.redoStack.length > 0) {
      const topCmdItem = this.redoStack.pop()!;
      const isBatched = topCmdItem.isBatched;
      const cmdItems: ICommandItem[] = [topCmdItem];

      if (isBatched) {
        // if the command is batched, redo all the commands marked "isBatched"
        while (this.redoStack.length > 0 && this.redoStack.at(-1)!.isBatched) {
          const currCmdItem = this.redoStack.pop()!;
          cmdItems.push(currCmdItem);
        }
        console.log('------- [redo] batched start -----');
      }

      for (const cmdItem of cmdItems) {
        const command = cmdItem.command;
        console.log(
          `%c Redo %c ${command.desc}`,
          'background: #f04; color: #ee0',
          '',
        );
        this.undoStack.push(cmdItem);
        cmdItem.hooks?.beforeRedo?.();
        command.redo();
      }

      if (isBatched) {
        console.log('------- [redo] batched end -----');
      }

      this.editor.sceneGraph.render();
      this.emitStatusChange();
    }
  }
  undo() {
    if (!this.isEnableRedoUndo) {
      return;
    }
    if (this.undoStack.length > 0) {
      const topCmdItem = this.undoStack.pop()!;
      const isBatched = topCmdItem.isBatched;
      const cmdItems: ICommandItem[] = [topCmdItem];

      if (isBatched) {
        // if the command is batched, undo all the commands marked "isBatched"
        while (this.undoStack.length > 0 && this.undoStack.at(-1)!.isBatched) {
          const currCmdItem = this.undoStack.pop()!;
          cmdItems.push(currCmdItem);
        }
        console.log('------- [undo] batched start -----');
      }

      for (const cmdItem of cmdItems) {
        const command = cmdItem.command;
        console.log(
          `%c Undo %c ${command.desc}`,
          'background: #40f; color: #eee',
          '',
        );
        this.redoStack.push(cmdItem);
        cmdItem.hooks?.beforeUndo?.();
        command.undo();
      }

      if (isBatched) {
        console.log('------- [undo] batched end -----');
      }

      this.editor.sceneGraph.render();
      this.emitStatusChange();
    }
  }
  enableRedoUndo() {
    this.isEnableRedoUndo = true;
  }
  disableRedoUndo() {
    this.isEnableRedoUndo = false;
  }
  batchCommandStart() {
    this.isBatching = true;
  }
  batchCommandEnd() {
    this.isBatching = false;
  }
  pushCommand(
    command: ICommand,
    hooks?: {
      beforeRedo?: () => void;
      beforeUndo?: () => void;
    },
  ) {
    this.emitter.emit('beforeExecCmd');
    console.log(
      `%c Exec %c ${command.desc}`,
      'background: #222; color: #bada55',
      '',
    );
    const commandItem: ICommandItem = { command };
    if (this.isBatching) {
      commandItem.isBatched = true;
    }
    if (hooks) {
      commandItem.hooks = hooks;
    }
    this.undoStack.push(commandItem);
    this.redoStack = [];
    this.emitStatusChange();
  }
  private emitStatusChange() {
    this.emitter.emit('change', {
      canRedo: this.redoStack.length > 0,
      canUndo: this.undoStack.length > 0,
    });
  }
  on<T extends keyof Events>(eventName: T, listener: Events[T]) {
    this.emitter.on(eventName, listener);
  }
  off<T extends keyof Events>(eventName: T, listener: Events[T]) {
    this.emitter.off(eventName, listener);
  }
  clearRecords() {
    this.redoStack = [];
    this.undoStack = [];
    this.emitStatusChange();
  }
}
