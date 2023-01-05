import { ICommand } from './type';
import { Rect } from '../../scene/rect';

/**
 * 创建矩形
 */
export class MoveElementsCommand implements ICommand {
  static readonly type = 'MoveElements';
  elements: Rect[];
  dx: number;
  dy: number;

  constructor(
    rects: Rect[],
    dx: number,
    dy: number
  ) {
    this.elements = rects;
    this.dx = dx;
    this.dy = dy;
  }
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
