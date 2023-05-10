import EventEmitter from '../../utils/event_emitter';
import { Editor } from '../editor';
import { ICommand } from './type';

export interface IHistoryStatus {
  canRedo: boolean;
  canUndo: boolean;
}

export class CommandManager {
  redoStack: ICommand[] = [];
  undoStack: ICommand[] = [];
  private isEnableRedoUndo = true;
  private emitter = new EventEmitter<{
    change(status: IHistoryStatus): void;
  }>();

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
        '',
      );
      this.undoStack.push(command);
      command.redo();

      this.editor.sceneGraph.render();
      this.emitStatusChange();
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
        '',
      );
      this.redoStack.push(command);
      command.undo();

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
  pushCommand(command: ICommand) {
    console.log(
      `%c Exec %c ${command.desc}`,
      'background: #222; color: #bada55',
      '',
    );
    this.undoStack.push(command);
    this.redoStack = [];
    this.emitStatusChange();
  }
  private emitStatusChange() {
    this.emitter.emit('change', {
      canRedo: this.redoStack.length > 0,
      canUndo: this.undoStack.length > 0,
    });
  }
  on(eventName: 'change', listener: (status: IHistoryStatus) => void) {
    this.emitter.on(eventName, listener);
  }
  off(eventName: 'change', listener: (status: IHistoryStatus) => void) {
    this.emitter.off(eventName, listener);
  }
}
