import { Graph } from '../graphs';
import { type ICommand } from './type';

export class MoveGraphsCommand implements ICommand {
  constructor(
    public desc: string,
    private graphs: Graph[],
    private dx: number,
    private dy: number,
  ) {}
  redo() {
    Graph.dMove(this.graphs, this.dx, this.dy);
  }
  undo() {
    Graph.dMove(this.graphs, -this.dx, -this.dy);
  }
}
