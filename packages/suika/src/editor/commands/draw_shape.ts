import { Graph } from '../../scene/graph';
import { SceneGraph } from '../../scene/scene-graph';
import { ICommand } from './type';

/**
 * 创建矩形
 */
export class AddShapeCommand implements ICommand {
  static readonly type = 'AddShape';
  idx = -1;

  constructor(private sceneGraph: SceneGraph, private element: Graph) {}
  redo() {
    // 往树中加上形状对象
    this.sceneGraph.appendChild(this.element, this.idx);
  }
  undo() {
    this.idx = this.sceneGraph.removeChild(this.element);
  }
}
