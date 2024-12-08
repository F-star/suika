export interface ICommand {
  desc: string;
  redo: () => void;
  undo: () => void;
}
