import { Editor } from '../editor';
import { ITool } from './type';

export class DrawTextTool implements ITool {
  static readonly type = 'drawText';
  readonly type = 'drawText';
  readonly hotkey = 't';

  constructor(private editor: Editor) {}
  active() {
    this.editor.setCursor('crosshair');
  }
  inactive() {
    this.editor.setCursor('default');
  }
  moveExcludeDrag() {
    // do nothing
  }
  start() {
    // do nothing
  }
  drag() {
    // do nothing
  }

  end(e: PointerEvent) {
    const { x, y } = this.editor.getCursorXY(e);

    // 让一个 input 元素出现在光标位置，然后输入内容回车。
    this.editor.textEditor.visible(x, y);
    this.editor.toolManager.setActiveTool('select');
  }

  afterEnd() {
    // do nothing
  }
}
