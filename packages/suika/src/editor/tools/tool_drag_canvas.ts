import { IBox, IPoint } from '../../type';
import { ICursor } from '../cursor_manager';
import { Editor } from '../editor';
import { ITool } from './type';

/**
 * drag canvas
 */
export class DragCanvasTool implements ITool {
  static type = 'dragCanvas';
  cursor: ICursor = 'grab';
  readonly type = 'dragCanvas';
  readonly hotkey = 'h';
  private startPoint: IPoint = { x: -1, y: -1 };
  private prevViewport!: IBox;

  constructor(private editor: Editor) {}
  active() {
    this.editor.canvasDragger.disableDragBySpace();
    this.editor.canvasDragger.active();
  }
  inactive() {
    this.editor.canvasDragger.inactive();
    this.editor.canvasDragger.enableDragBySpace();
  }
  moveExcludeDrag() {
    // noop
  }
  start() {
    // noop
  }
  drag() {
    // noop
  }
  end() {
    // noop
  }
  afterEnd() {
    // ToolManager will exec enableDragBySpace() when tool end
    this.editor.canvasDragger.disableDragBySpace();
  }
}
