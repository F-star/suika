import { Ellipse } from '../scene/ellipse';
import { Editor } from '../editor';
import { DrawGraphTool } from './tool_draw_graph';
import { ITool } from './type';
import { cloneDeep } from '@suika/common';
import { IRect } from '@suika/geo';
import { normalizeRect } from '@suika/geo';

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
