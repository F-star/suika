import { type Graph } from '../graphs';
import { type ICommand } from './type';

export class MoveGraphsCommand implements ICommand {
  constructor(
    public desc: string,
    private graphs: Graph[],
    private dx: number,
    private dy: number,
  ) {}
  redo() {
    const { dx, dy } = this;
    for (let i = 0, len = this.graphs.length; i < len; i++) {
      const element = this.graphs[i];
      element.updateAttrs({ x: element.attrs.x + dx, y: element.attrs.y + dy });
    }
  }
  undo() {
    const { dx, dy } = this;
    for (let i = 0, len = this.graphs.length; i < len; i++) {
      const element = this.graphs[i];
      element.updateAttrs({ x: element.attrs.x - dx, y: element.attrs.y - dy });
    }
  }
}
