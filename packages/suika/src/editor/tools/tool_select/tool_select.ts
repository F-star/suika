import throttle from 'lodash.throttle';
import { Graph } from '../../scene/graph';
import { Rect } from '../../scene/rect';
import { IPoint } from '../../../type';
import { Editor } from '../../editor';
import { IBaseTool, ITool } from '../type';
import { DrawSelectionBox } from './tool_select_selection';
import { SelectMoveTool } from './tool_select_move';
import { SelectRotationTool } from './tool_select_rotation';
import { SelectScaleTool } from './tool_select_scale';
import { ICursor } from '../../cursor_manager';

export class SelectTool implements ITool {
  static type = 'select';
  type = 'select';
  hotkey = 'v';

  startPoint: IPoint = { x: -1, y: -1 };
  drawingRect: Rect | null = null;
  currStrategy: IBaseTool | null = null;
  // 策略
  strategyMove: SelectMoveTool;
  strategyDrawSelectionBox: DrawSelectionBox;
  strategySelectRotation: SelectRotationTool;
  strategySelectScale: SelectScaleTool;

  // 鼠标按下时选中的元素，在鼠标释放时可能会用到。shift 取消一个元素时需要使用
  topHitElementWhenStart: Graph | null = null;
  isDragHappened = false; // 发生过拖拽

  constructor(private editor: Editor) {
    this.strategyMove = new SelectMoveTool(editor);
    this.strategyDrawSelectionBox = new DrawSelectionBox(editor);
    this.strategySelectRotation = new SelectRotationTool(editor);
    this.strategySelectScale = new SelectScaleTool(editor);
  }
  active() {
    this.editor.setCursor('default');
  }
  inactive() {
    this.editor.setCursor('default');

    this.editor.selectedElements.clear();
    this.editor.sceneGraph.render();
  }
  moveExcludeDrag = throttle((e: PointerEvent) => {
    if (this.editor.hostEventManager.isSpacePressing) {
      return;
    }
    const pointer = this.editor.getSceneCursorXY(e);
    const transformHandleName =
      this.editor.sceneGraph.transformHandle.getNameByPoint(pointer);

    let cursor: ICursor = 'default';
    if (transformHandleName === 'rotation') {
      cursor = 'grab';
    } else if (transformHandleName === 'se') {
      cursor = { type: 'resize', degree: 112.5 };
    }
    this.editor.setCursor(cursor);
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

    this.startPoint = this.editor.getSceneCursorXY(e);

    // 0. 点中 handle（旋转点）
    const handleName = sceneGraph.transformHandle.getNameByPoint(
      this.startPoint,
    );
    // if (handleName) {
    if (handleName === 'rotation') {
      this.currStrategy = this.strategySelectRotation;
    }
    // TODO: now only support se scale handle
    else if (handleName === 'se') {
      this.currStrategy = this.strategySelectScale;
    }
    // }

    // 1. 点击落在选中盒中
    else if (
      !isShiftPressing &&
      sceneGraph.isPointInSelectedBox(this.startPoint)
    ) {
      this.currStrategy = this.strategyMove;
    } else {
      const topHitElement = sceneGraph.getTopHitElement(
        this.startPoint.x,
        this.startPoint.y,
      );
      // 2. 点中一个元素 （FIXME: 没考虑描边的情况）
      if (topHitElement) {
        // 按住 shift 键的选中，添加或移除一个选中元素
        if (isShiftPressing) {
          // 延迟到鼠标释放时才将元素从选中元素中移出
          if (selectedElements.getItems().includes(topHitElement)) {
            this.topHitElementWhenStart = topHitElement;
          } else {
            selectedElements.toggleItems([topHitElement]);
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
      this.editor.selectedElements.toggleItems([this.topHitElementWhenStart]);
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
    if (!this.editor.hostEventManager.isDraggingCanvasBySpace) {
      this.editor.setCursor('default');
    }
    this.topHitElementWhenStart = null;
    this.isDragHappened = false;
    this.currStrategy?.afterEnd();
    this.currStrategy = null;
  }
}
