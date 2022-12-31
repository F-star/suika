import { Rect } from '../../../scene-graph';
import { IPoint } from '../../../type.interface';
import { getRectByTwoCoord } from '../../../utils/graphics';
import { Editor } from '../../editor';
import { ITool } from '../type';


export class SelectTool implements ITool {
  static type = 'select';
  type = 'select';
  lastPointer: IPoint = { x: -1, y: -1 };
  drawingRect: Rect | null = null;

  constructor(private editor: Editor) {}
  active() {
    this.editor.canvasElement.style.cursor = '';
    console.log('select 工具挂载');
  }
  inactive() {
    this.editor.canvasElement.style.cursor = '';
  }
  start(e: PointerEvent) {
    // 1. 直接选中一个元素
    // 2. 没选中，拖拽，产生选区
    // 3. 选中缩放或旋转控制点
  }
  drag(e: PointerEvent) {
    //
  }
  end(e: PointerEvent) {
    //
  }
}
