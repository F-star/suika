import { ICursor } from '../cursor_manager';
import { Editor } from '../editor';
import { ITool } from './type';

const TYPE = 'drawText';
const HOTKEY = 't';

export class DrawTextTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'crosshair';

  constructor(private editor: Editor) {}
  onActive() {
    // noop
  }
  onInactive() {
    // noop
  }
  onMoveExcludeDrag() {
    // do nothing
  }
  onStart() {
    // do nothing
  }
  onDrag() {
    // do nothing
  }

  onEnd(e: PointerEvent) {
    const { x, y } = this.editor.getCursorXY(e);

    // 让一个 input 元素出现在光标位置，然后输入内容回车。
    this.editor.textEditor.visible(x, y);
    if (!this.editor.setting.get('keepToolSelectedAfterUse')) {
      this.editor.toolManager.setActiveTool('select');
    }
  }

  afterEnd() {
    // do nothing
  }
}
