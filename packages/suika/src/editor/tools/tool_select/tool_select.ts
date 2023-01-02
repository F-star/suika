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
    // 有几种情况
    // 1. 直接选中一个元素
    // 2. 没选中，拖拽，产生选区
    // 3. 选中缩放或旋转控制点
    // 4. 选中 选中框 内部
    this.lastPointer = {
      x: e.clientX,
      y: e.clientY,
    };
    // 判断是否选中
    // FIXME: 没考虑描边的情况
    const topHidElement = this.editor.sceneGraph.getTopHitElement(
      this.lastPointer
    );
    console.log(topHidElement ? '选中了' : '没选中');
    if (topHidElement) {
      this.editor.selectedElements.setItems([topHidElement]);
      this.editor.sceneGraph.render();
    } else {
      this.editor.selectedElements.clear();
      this.editor.sceneGraph.render();
      // 设置选区
      this.editor.sceneGraph.setSelection(this.lastPointer);
    }
  }
  drag(e: PointerEvent) {
    const width = e.clientX - this.lastPointer.x;
    const height = e.clientY - this.lastPointer.y;

    this.editor.sceneGraph.setSelection({ width, height });
    this.editor.sceneGraph.render();
  }
  end(e: PointerEvent) {
    this.editor.sceneGraph.selection = null;
    this.editor.sceneGraph.render();
  }
}
