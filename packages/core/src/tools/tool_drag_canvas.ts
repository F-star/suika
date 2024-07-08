import { type ICursor } from '../cursor_manager';
import { type SuikaEditor } from '../editor';
import { type ITool } from './type';

const TYPE = 'dragCanvas';
const HOTKEY = 'h';

export class DragCanvasTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'grab';

  constructor(private editor: SuikaEditor) {}
  onActive() {
    this.editor.canvasDragger.disableDragBySpace();
    this.editor.canvasDragger.active();
  }
  onInactive() {
    this.editor.canvasDragger.inactive();
    this.editor.canvasDragger.enableDragBySpace();
  }
  onMoveExcludeDrag() {
    // noop
  }
  onStart() {
    // noop
  }
  onDrag() {
    // noop
  }
  onEnd() {
    // noop
  }
  afterEnd() {
    // ToolManager will exec enableDragBySpace() when tool end
    this.editor.canvasDragger.disableDragBySpace();
  }
}
