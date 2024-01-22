import { cloneDeep } from '@suika/common';
import { IRect, normalizeRect } from '@suika/geo';

import { Editor } from '../editor';
import { Rect } from '../graphs';
import { DrawGraphTool } from './tool_draw_graph';
import { ITool } from './type';

export class DrawRectTool extends DrawGraphTool implements ITool {
  static override readonly type = 'drawRect';
  override readonly type = 'drawRect';
  override readonly hotkey = 'r';

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
