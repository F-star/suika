import { Rect } from '../../scene/rect';
import { SceneGraph } from '../../scene/scene-graph';
import { ICommand } from './type';

/**
 * 创建矩形
 */
export class AddRectCommand implements ICommand {
  static readonly type = 'AddRect';
  element: Rect;
  idx = -1;

  constructor(
    private sceneGraph: SceneGraph,
    rect: Rect
  ) {
    this.element = rect;
  }
  redo() {
    // 往树中加上矩形对象
    this.sceneGraph.appendChild(this.element, this.idx);
  }
  undo() {
    this.idx = this.sceneGraph.removeChild(this.element);
  }
}