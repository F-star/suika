import { throttle } from '@suika/common';
import { Graph } from '../../scene/graph';
import { IPoint } from '../../type';
import { Editor } from '../../editor';
import { IBaseTool, ITool } from '../type';
import { DrawSelectionBox } from './tool_select_selection';
import { SelectMoveTool } from './tool_select_move';
import { SelectRotationTool } from './tool_select_rotation';
import { SelectResizeTool } from './tool_select_resize';
import { ICursor, isRotationCursor } from '../../cursor_manager';

/**
 * Select Tool
 *
 * reference: https://mp.weixin.qq.com/s/lXv5_bisMHVHqtv2DwflwA
 */
export class SelectTool implements ITool {
  static type = 'select';
  cursor: ICursor = 'default';
  type = 'select';
  hotkey = 'v';

  private startPoint: IPoint = { x: -1, y: -1 };
  private currStrategy: IBaseTool | null = null;
  // 策略
  private readonly strategyMove: SelectMoveTool;
  private readonly strategyDrawSelectionBox: DrawSelectionBox;
  private readonly strategySelectRotation: SelectRotationTool;
  private readonly strategySelectResize: SelectResizeTool;

  // 鼠标按下时选中的元素，在鼠标释放时可能会用到。shift 取消一个元素时需要使用
  private topHitElementWhenStart: Graph | null = null;
  private isDragHappened = false; // 发生过拖拽

  private handleHoverItemChange = () => {
    if (!this.editor.toolManager.isDragging) {
      this.editor.sceneGraph.render();
    }
  };

  private handleSpaceToggle = (press: boolean) => {
    if (press) {
      this.editor.selectedElements.setHoverItem(null);
    }
    // TODO: resetHoverItem after drag canvas end
  };

  constructor(private editor: Editor) {
    this.strategyMove = new SelectMoveTool(editor);
    this.strategyDrawSelectionBox = new DrawSelectionBox(editor);
    this.strategySelectRotation = new SelectRotationTool(editor);
    this.strategySelectResize = new SelectResizeTool(editor);
  }
  active() {
    this.editor.selectedElements.on(
      'hoverItemChange',
      this.handleHoverItemChange,
    );
    this.editor.hostEventManager.on('spaceToggle', this.handleSpaceToggle);
  }
  inactive() {
    this.editor.selectedElements.off(
      'hoverItemChange',
      this.handleHoverItemChange,
    );
    this.editor.hostEventManager.off('spaceToggle', this.handleSpaceToggle);

    this.editor.selectedElements.clear();
    this.editor.sceneGraph.render();
  }

  moveExcludeDrag(e: PointerEvent, isOutsideCanvas: boolean) {
    if (isOutsideCanvas) return;

    const point = this.editor.getSceneCursorXY(e);
    this.updateCursorAndHlHoverGraph(point);
    this.editor.selectedBox.setHoverByPoint(point);
  }

  private updateCursorAndHlHoverGraph = throttle((point: IPoint) => {
    if (this.editor.canvasDragger.isActive()) {
      return;
    }
    const controlHandleManager = this.editor.controlHandleManager;
    const handleInfo = controlHandleManager.getHandleInfoByPoint(point);

    this.editor.setCursor(handleInfo?.cursor || 'default');

    if (handleInfo) {
      this.editor.selectedElements.setHoverItem(null);
    } else {
      const topHitElement = this.editor.sceneGraph.getTopHitElement(
        point.x,
        point.y,
      );
      this.editor.selectedElements.setHoverItem(topHitElement);
    }
  }, 20);

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

    const handleInfo = this.editor.controlHandleManager.getHandleInfoByPoint(
      this.startPoint,
    );

    if (handleInfo) {
      if (isRotationCursor(handleInfo.cursor)) {
        this.strategySelectRotation.handleType = handleInfo.handleName;
        this.currStrategy = this.strategySelectRotation;
      } else {
        this.currStrategy = this.strategySelectResize;
      }
    }

    // 1. 点击落在选中盒中
    else if (this.editor.selectedBox.isPointInBox(this.startPoint)) {
      this.currStrategy = this.strategyMove;
    } else {
      const topHitElement = sceneGraph.getTopHitElement(
        this.startPoint.x,
        this.startPoint.y,
      );
      // 2. 点中一个元素
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

        this.editor.selectedBox.setHover(true);
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
  end(e: PointerEvent, isDragHappened: boolean) {
    this.editor.controlHandleManager.showCustomHandles();

    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }

    if (this.topHitElementWhenStart && !this.isDragHappened) {
      this.editor.selectedElements.toggleItems([this.topHitElementWhenStart]);
      this.editor.sceneGraph.render();
    }

    const currStrategy = this.currStrategy;
    if (currStrategy) {
      currStrategy.end(e, isDragHappened);
      currStrategy.inactive();
    } else {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
  }
  afterEnd(e: PointerEvent) {
    if (!this.editor.hostEventManager.isDraggingCanvasBySpace) {
      this.editor.setCursor('default');
    }
    this.topHitElementWhenStart = null;
    this.isDragHappened = false;
    this.currStrategy?.afterEnd(e);
    this.currStrategy = null;

    const point = this.editor.getSceneCursorXY(e);
    this.editor.selectedBox.setHoverByPoint(point);
    this.updateCursorAndHlHoverGraph(point);
  }
}
