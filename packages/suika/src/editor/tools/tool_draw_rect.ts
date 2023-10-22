import { Rect } from '../scene/rect';
import { Editor } from '../editor';
import { DrawGraphTool } from './tool_draw_graph';
import { ITool } from './type';
import cloneDeep from 'lodash.clonedeep';
import { IRect } from '../../type';
import { normalizeRect } from '../../utils/graphics';

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
