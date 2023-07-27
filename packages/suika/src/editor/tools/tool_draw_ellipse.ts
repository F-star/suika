import { Ellipse } from '../scene/ellipse';
import { Editor } from '../editor';
import { DrawShapeTool } from './tool_draw_shape';
import { ITool } from './type';
import cloneDeep from 'lodash.clonedeep';
import { IRect } from '../../type';
import { normalizeRect } from '../../utils/graphics';

export class DrawEllipseTool extends DrawShapeTool implements ITool {
  static readonly type = 'drawEllipse';
  readonly type = 'drawEllipse';
  readonly hotkey = 'o';

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
