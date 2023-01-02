export interface ICommand {
  redo: (...args: any) => any;
  undo: (...args: any) => any;
}
