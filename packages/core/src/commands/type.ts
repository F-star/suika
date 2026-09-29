export interface ICommand {
  readonly id: string;
  desc: string;
  redo: () => void;
  undo: () => void;
}
