export interface ICommand {
  desc: string;
  redo: (...args: any) => any;
  undo: (...args: any) => any;
}
