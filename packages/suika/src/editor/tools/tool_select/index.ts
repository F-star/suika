import { Rect } from '../../../scene/scene-graph';
import { IPoint } from '../../../type.interface';
import { Editor } from '../../editor';
import { IBaseTool, ITool } from '../type';
import { DrawSelectionBox } from './draw_select_box';
import { SelectMoveTool } from './move';

export class SelectTool implements ITool {
  static type = 'select';
  type = 'select';
  lastPointer: IPoint = { x: -1, y: -1 };
  drawingRect: Rect | null = null;

  currStrategy: IBaseTool;

  strategyMove: SelectMoveTool;
  strategyDrawSelectionBox: DrawSelectionBox;


  constructor(private editor: Editor) {
    this.strategyMove = new SelectMoveTool(editor);
    this.strategyMove = new SelectMoveTool(editor);
    this.strategyDrawSelectionBox = new DrawSelectionBox(editor);
    this.currStrategy = this.strategyMove;
  }
  active() {
    this.editor.canvasElement.style.cursor = '';
    console.log('select 工具挂载');
  }
  inactive() {
    this.editor.canvasElement.style.cursor = '';
    this.editor.selectedElements.clear();
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

    // 0. 是否点中 handler（缩放点）

    // 1. 判断是否落在选中盒中
    const isInSelectedBox = this.editor.sceneGraph.isPointInSelectedBox(this.lastPointer);
    if (isInSelectedBox) {
      this.currStrategy = this.strategyMove;
    } else {
      // 2. 判断是否选中 （FIXME: 没考虑描边的情况）
      const topHidElement = this.editor.sceneGraph.getTopHitElement(
        this.lastPointer
      );

      if (topHidElement) { // 选中一个元素
        this.editor.selectedElements.setItems([topHidElement]);
        this.editor.sceneGraph.render();
        this.currStrategy = this.strategyMove;
      } else { // 点击到空白区域
        this.currStrategy = this.strategyDrawSelectionBox;
      }
    }

    this.currStrategy.start(e);
  }
  drag(e: PointerEvent) {
    this.currStrategy.drag(e);
  }
  end(e: PointerEvent) {
    this.currStrategy.end(e);
  }
}
