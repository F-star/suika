import { Rect } from '../scene/rect';
import { Editor } from '../editor';
import { DrawShapeTool } from './tool_draw_shape';
import { ITool } from './type';

export class DrawRectTool extends DrawShapeTool implements ITool {
  static type = 'drawRect';
  type = 'drawRect';
  hotkey = 'r';

  constructor(editor: Editor) {
    super(editor);
    this.ShapeCtor = Rect;
    this.commandDesc = 'Add Rect';
  }
}
