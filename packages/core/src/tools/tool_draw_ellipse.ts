import { cloneDeep } from '@suika/common';
import { IRect, normalizeRect } from '@suika/geo';

import { Editor } from '../editor';
import { Ellipse } from '../graphs';
import { DrawGraphTool } from './tool_draw_graph';
import { ITool } from './type';

export class DrawEllipseTool extends DrawGraphTool implements ITool {
  static override readonly type = 'drawEllipse';
  override readonly type = 'drawEllipse';
  override readonly hotkey = 'o';

  constructor(editor: Editor) {
    super(editor);
    this.commandDesc = 'Add Ellipse';
  }

  protected createGraph(rect: IRect) {
    rect = normalizeRect(rect);
    return new Ellipse({
      ...rect,
      fill: [cloneDeep(this.editor.setting.get('firstFill'))],
    });
  }
}
