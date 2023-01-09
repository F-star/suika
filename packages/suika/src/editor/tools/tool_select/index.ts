import { Rect } from '../../../scene/rect';
import { IPoint } from '../../../type.interface';
import { Editor } from '../../editor';
import { IBaseTool, ITool } from '../type';
import { DrawSelectionBox } from './draw_select_box';
import { SelectMoveTool } from './move';
import { SelectRotationTool } from './rotation';

export class SelectTool implements ITool {
  static type = 'select';
  type = 'select';
  startPointer: IPoint = { x: -1, y: -1 };
  drawingRect: Rect | null = null;
  currStrategy: IBaseTool | null;
  // 策略
  strategyMove: SelectMoveTool;
  strategyDrawSelectionBox: DrawSelectionBox;
  strategySelectRotation: SelectRotationTool;

  constructor(private editor: Editor) {
    this.strategyMove = new SelectMoveTool(editor);
    this.strategyMove = new SelectMoveTool(editor);
    this.strategyDrawSelectionBox = new DrawSelectionBox(editor);
    this.strategySelectRotation = new SelectRotationTool(editor);
    this.currStrategy = this.strategyMove;
  }
  active() {
    this.editor.canvasElement.style.cursor = '';
  }
  inactive() {
    this.editor.canvasElement.style.cursor = '';
    this.editor.selectedElements.clear();
    this.editor.sceneGraph.render();
  }
  start(e: PointerEvent) {
    // 有几种情况
    // 1. 直接选中一个元素
    // 2. 没选中，拖拽，产生选区
    // 3. 选中缩放或旋转控制点
    // 4. 选中 选中框 内部

    const sceneGraph = this.editor.sceneGraph;
    const isShiftPressing = this.editor.hotkeysManager.isShiftPressing;

    this.startPointer = this.editor.viewportCoordsToScene(e.clientX, e.clientY);
    this.currStrategy = null;
    // 0. 点中 handle（旋转点）
    if (sceneGraph.isInRotationHandle(this.startPointer)) {
      this.currStrategy = this.strategySelectRotation;
    }

    // 1. 点击落在选中盒中
    else if (!isShiftPressing && sceneGraph.isPointInSelectedBox(this.startPointer)) {
      this.currStrategy = this.strategyMove;
    } else {
      const topHidElement = sceneGraph.getTopHitElement(this.startPointer);
      // 2. 点中一个元素 （FIXME: 没考虑描边的情况）
      if (topHidElement) {
        // 按住 shift 键的选中，添加或移除一个选中元素
        if (isShiftPressing) {
          this.editor.selectedElements.toggleElement(topHidElement);
        } else {
          this.editor.selectedElements.setItems([topHidElement]);
        }

        this.editor.sceneGraph.render();
        this.currStrategy = this.strategyMove;
      } else {
        // 点击到空白区域
        // 但是存在选中元素，且按下了 shift 键，就进入连选元素并移动分支
        if (!this.editor.selectedElements.isEmpty() && isShiftPressing) {
          this.currStrategy = this.strategyMove;
        } else {
          this.currStrategy = this.strategyDrawSelectionBox;
        }
      }
    }
    if (!this.currStrategy) {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
    this.currStrategy.active();
    this.currStrategy.start(e);
  }
  drag(e: PointerEvent) {
    if (!this.currStrategy) {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
    this.currStrategy.drag(e);
  }
  end(e: PointerEvent) {
    if (!this.currStrategy) {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
    this.currStrategy.end(e);
    this.currStrategy.inactive();
  }
}
