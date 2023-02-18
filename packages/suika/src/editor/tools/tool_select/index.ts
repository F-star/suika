import throttle from 'lodash.throttle';
import { Graph } from '../../scene/graph';
import { Rect } from '../../scene/rect';
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
  currStrategy: IBaseTool | null = null;
  // 策略
  strategyMove: SelectMoveTool;
  strategyDrawSelectionBox: DrawSelectionBox;
  strategySelectRotation: SelectRotationTool;

  // 鼠标按下时选中的元素，在鼠标释放时可能会用到。shift 取消一个元素时需要使用
  topHitElementWhenStart: Graph | null = null;
  isDragHappened = false; // 发生过拖拽

  constructor(private editor: Editor) {
    this.strategyMove = new SelectMoveTool(editor);
    this.strategyDrawSelectionBox = new DrawSelectionBox(editor);
    this.strategySelectRotation = new SelectRotationTool(editor);
  }
  active() {
    this.editor.setCursor('');
  }
  inactive() {
    this.editor.setCursor('');

    this.editor.selectedElements.clear();
    this.editor.sceneGraph.render();
  }
  moveExcludeDrag = throttle((e: PointerEvent) => {
    if (this.editor.hostEventManager.isSpacePressing) {
      return;
    }
    const pos = this.editor.getPointerXY(e);
    const pointer = this.editor.viewportCoordsToScene(pos.x, pos.y);

    const transformHandle = this.editor.sceneGraph.transformHandle;
    if (transformHandle.getTransformHandleByPoint(pointer) === 'rotation') {
      this.editor.setCursor('grab');
    } else {
      this.editor.setCursor('');
    }
  }, 50);
  start(e: PointerEvent) {
    this.currStrategy = null;
    this.topHitElementWhenStart = null;
    this.isDragHappened = false;

    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }
    // 有几种情况
    // 1. 直接选中一个元素
    // 2. 没选中，拖拽，产生选区
    // 3. 选中缩放或旋转控制点
    // 4. 选中 选中框 内部
    // 5. 按住 shift 键，可进行连选

    const sceneGraph = this.editor.sceneGraph;
    const selectedElements = this.editor.selectedElements;
    const isShiftPressing = this.editor.hostEventManager.isShiftPressing;

    const pos = this.editor.getPointerXY(e);
    this.startPointer = this.editor.viewportCoordsToScene(pos.x, pos.y);

    // 0. 点中 handle（旋转点）
    if (sceneGraph.transformHandle.getTransformHandleByPoint(this.startPointer) === 'rotation') {
      this.currStrategy = this.strategySelectRotation;
    }

    // 1. 点击落在选中盒中
    else if (
      !isShiftPressing &&
      sceneGraph.isPointInSelectedBox(this.startPointer)
    ) {
      this.currStrategy = this.strategyMove;
    } else {
      const topHitElement = sceneGraph.getTopHitElement(this.startPointer);
      // 2. 点中一个元素 （FIXME: 没考虑描边的情况）
      if (topHitElement) {
        // 按住 shift 键的选中，添加或移除一个选中元素
        if (isShiftPressing) {
          // 延迟到鼠标释放时才将元素从选中元素中移出
          if (selectedElements.getItems().includes(topHitElement)) {
            this.topHitElementWhenStart = topHitElement;
          } else {
            selectedElements.toggleElement([topHitElement]);
          }
        } else {
          selectedElements.setItems([topHitElement]);
        }

        sceneGraph.render();
        this.currStrategy = this.strategyMove;
      } else {
        // 3. 点击到空白区域
        this.currStrategy = this.strategyDrawSelectionBox;
      }
    }

    if (this.currStrategy) {
      this.currStrategy.active();
      this.currStrategy.start(e);
    } else {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
  }
  drag(e: PointerEvent) {
    this.isDragHappened = true;

    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }

    if (this.currStrategy) {
      this.currStrategy.drag(e);
    } else {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
  }
  end(e: PointerEvent, isEnableDrag: boolean) {
    const currStrategy = this.currStrategy;

    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }

    if (this.topHitElementWhenStart && !this.isDragHappened) {
      this.editor.selectedElements.toggleElement([this.topHitElementWhenStart]);
      this.editor.sceneGraph.render();
    }

    if (currStrategy) {
      currStrategy.end(e, isEnableDrag);
      currStrategy.inactive();
    } else {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
  }
  afterEnd() {
    this.editor.setCursor('');
    this.topHitElementWhenStart = null;
    this.isDragHappened = false;
    this.currStrategy?.afterEnd();
    this.currStrategy = null;
  }
}
