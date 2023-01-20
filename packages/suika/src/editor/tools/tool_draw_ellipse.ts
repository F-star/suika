import { Ellipse } from '../scene/ellipse';
import { Editor } from '../editor';
import { DrawShapeTool } from './tool_draw_shape';
import { ITool } from './type';

export class DrawEllipseTool extends DrawShapeTool implements ITool {
  static type = 'drawEllipse';
  type = 'drawEllipse';

  constructor(editor: Editor) {
    super(editor);
    this.ShapeCtor = Ellipse;
  }
}
