import { cloneDeep } from '@suika/common';
import { IRect, normalizeRect } from '@suika/geo';

import { Editor } from '../editor';
import { Rect } from '../graphs';
import { DrawGraphTool } from './tool_draw_graph';
import { ITool } from './type';

const TYPE = 'drawRect';
const HOTKEY = 'r';

export class DrawRectTool extends DrawGraphTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  constructor(editor: Editor) {
    super(editor);
    this.commandDesc = 'Add Rect';
  }

  protected createGraph(rect: IRect) {
    rect = normalizeRect(rect);
    return new Rect({
      ...rect,
      fill: [cloneDeep(this.editor.setting.get('firstFill'))],
    });
  }
}
