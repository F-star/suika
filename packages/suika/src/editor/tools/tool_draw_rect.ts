import { Rect } from '../scene/rect';
import { Editor } from '../editor';
import { DrawShapeTool } from './tool_draw_shape';
import { ITool } from './type';
import cloneDeep from 'lodash.clonedeep';
import { IRect } from '../../type';
import { normalizeRect } from '../../utils/graphics';

export class DrawRectTool extends DrawShapeTool implements ITool {
  static readonly type = 'drawRect';
  readonly type = 'drawRect';
  readonly hotkey = 'r';

  constructor(editor: Editor) {
    super(editor);
    this.commandDesc = 'Add Rect';
  }

  protected createGraph(rect: IRect) {
    rect = normalizeRect(rect);
    return new Rect({
      ...rect,
      fill: [cloneDeep(this.editor.setting.get('firstFill'))],
      strokeWidth: this.editor.setting.get('strokeWidth'),
    });
  }
}
