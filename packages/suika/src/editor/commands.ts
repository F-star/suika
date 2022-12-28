import { Rect, SceneGraph } from '../scene-graph';

export class CommandManger {
  redoStack: Command[] = [];
  undoStack: Command[] = [];

  constructor(private sceneGraph: SceneGraph) {}

  redo() {
    if (this.redoStack.length > 0) {
      const command = this.redoStack.pop()!;
      command.redo();
    }
  }
  undo() {
    if (this.undoStack.length > 0) {
      const command = this.undoStack.pop()!;
      command.undo();
      this.sceneGraph.render();
    }
  }
  execCmd(cmdName: string, ...options: any[]) {
    if (cmdName === AddRectCommand.type) {
      const _options = options[0];
      this.undoStack.push(
        new AddRectCommand(this.sceneGraph, _options)
      );
    }
  }
}

interface Command {
  redo: (...args: any) => any;
  undo: (...args: any) => any;
}

type IAddRectCommand = {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 创建矩形
 */
class AddRectCommand implements Command {
  static readonly type = 'AddRect';
  x: number;
  y: number;
  width: number;
  height: number;
  element!: Rect;

  constructor(private sceneGraph: SceneGraph, {
    x, y, width, height,
  }: IAddRectCommand) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  redo() {
    // 往树中加上矩形对象
    this.element = this.sceneGraph.addRect(this);
  }
  undo() {
    this.sceneGraph.removeChild(this.element);
  }
}