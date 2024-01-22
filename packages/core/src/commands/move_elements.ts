import { Graph } from '../graphs';
import { ICommand } from './type';

/**
 * move elements
 */
export class MoveElementsCommand implements ICommand {
  constructor(
    public desc: string,
    private elements: Graph[],
    private dx: number,
    private dy: number,
  ) {}
  redo() {
    const { dx, dy } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      const element = this.elements[i];
      element.x = element.x + dx;
      element.y = element.y + dy;
    }
  }
  undo() {
    const { dx, dy } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      const element = this.elements[i];
      element.x = element.x - dx;
      element.y = element.y - dy;
    }
  }
}
