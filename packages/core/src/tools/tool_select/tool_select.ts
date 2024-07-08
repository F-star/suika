import { throttle } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { type ICursor, isRotationCursor } from '../../cursor_manager';
import { type SuikaEditor } from '../../editor';
import {
  SuikaFrame,
  type SuikaGraphics,
  SuikaPath,
  SuikaText,
} from '../../graphs';
import { type IBaseTool, type ITool } from '../type';
import { SelectMoveTool } from './tool_select_move';
import { SelectResizeTool } from './tool_select_resize';
import { SelectRotationTool } from './tool_select_rotation';
import { DrawSelection as DrawSelectionTool } from './tool_select_selection';
import { getTopHitElement } from './utils';

const TYPE = 'select';
const HOTKEY = 'v';

/**
 * Select Tool
 * reference: https://mp.weixin.qq.com/s/lXv5_bisMHVHqtv2DwflwA
 */
export class SelectTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'default';

  private startPoint: IPoint = { x: -1, y: -1 };
  private currStrategy: IBaseTool | null = null;
  // 策略
  private readonly strategyMove: SelectMoveTool;
  private readonly strategyDrawSelection: DrawSelectionTool;
  private readonly strategySelectRotation: SelectRotationTool;
  private readonly strategySelectResize: SelectResizeTool;

  /** the graph should be removed from selected if not moved */
  private graphShouldRemovedFromSelectedIfNotMoved: SuikaGraphics | null = null;

  constructor(private editor: SuikaEditor) {
    this.strategyMove = new SelectMoveTool(editor);
    this.strategyDrawSelection = new DrawSelectionTool(editor);
    this.strategySelectRotation = new SelectRotationTool(editor);
    this.strategySelectResize = new SelectResizeTool(editor);
  }

  private handleHoverItemChange = () => {
    if (!this.editor.toolManager.isDragging()) {
      this.editor.render();
    }
  };

  // double click to active path editor
  private onContinueClick = () => {
    const point = this.editor.toolManager.getCurrPoint();
    const editor = this.editor;
    const handleInfo = editor.controlHandleManager.getHandleInfoByPoint(point);
    if (handleInfo) return;

    const topHitElement = getTopHitElement(editor, point);

    if (!topHitElement) {
      return;
    }

    if (topHitElement instanceof SuikaPath) {
      editor.pathEditor.active(topHitElement);
    } else if (topHitElement instanceof SuikaText) {
      editor.textEditor.active({ textGraph: topHitElement });
    } else if (topHitElement instanceof SuikaFrame) {
      const children = topHitElement.getChildren();
      for (let i = children.length - 1; i >= 0; i--) {
        if (children[i].hitTestChildren(point.x, point.y)) {
          if (this.editor.hostEventManager.isShiftPressing) {
            this.editor.selectedElements.toggleItems([children[i]]);
          } else {
            this.editor.selectedElements.setItems([children[i]]);
          }
          editor.selectedElements.setHoverItem(children[i]);
          break;
        }
      }
    }
  };

  onActive() {
    this.editor.selectedElements.on(
      'hoverItemChange',
      this.handleHoverItemChange,
    );
    this.editor.hostEventManager.on('continueClick', this.onContinueClick);
  }
  onInactive() {
    this.editor.selectedElements.off(
      'hoverItemChange',
      this.handleHoverItemChange,
    );
    this.editor.hostEventManager.off('continueClick', this.onContinueClick);
    this.editor.render();
  }

  onMoveExcludeDrag(e: PointerEvent, isOutsideCanvas: boolean) {
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

    if (
      handleInfo ||
      (!this.editor.hostEventManager.isShiftPressing &&
        this.editor.selectedBox.hitTest(point))
    ) {
      this.editor.selectedElements.setHoverItem(null);
    } else {
      const topHitElement = getTopHitElement(this.editor, point);
      this.editor.selectedElements.setHoverItem(topHitElement);
    }
  }, 20);

  onStart(e: PointerEvent) {
    this.currStrategy = null;
    this.graphShouldRemovedFromSelectedIfNotMoved = null;

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
    } else {
      const isInsideSelectedBox = this.editor.selectedBox.hitTest(
        this.startPoint,
      );
      const topHitElement = getTopHitElement(this.editor, this.startPoint);
      if (
        topHitElement &&
        isShiftPressing &&
        selectedElements.getItems().includes(topHitElement)
      ) {
        this.graphShouldRemovedFromSelectedIfNotMoved = topHitElement;
      }

      // 1. 点击落在选中盒中
      if (isInsideSelectedBox) {
        this.currStrategy = this.strategyMove;
      } else {
        // 2. 点中一个元素
        if (topHitElement) {
          // 单选
          if (!isShiftPressing) {
            selectedElements.setItems([topHitElement]);
          }
          // 连选：按住 shift 键的选中，添加或移除一个选中元素
          else {
            // 延迟到鼠标释放时才将元素从选中元素中移出
            if (!selectedElements.getItems().includes(topHitElement)) {
              selectedElements.toggleItems([topHitElement]);
            }
          }

          this.editor.selectedBox.setHover(true);
          sceneGraph.render();
          this.currStrategy = this.strategyMove;
        } else {
          // 3. 点击到空白区域
          this.currStrategy = this.strategyDrawSelection;
        }
      }
    }

    if (this.currStrategy) {
      this.currStrategy.onActive();
      this.currStrategy.onStart(e);
    } else {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
  }
  onDrag(e: PointerEvent) {
    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }

    if (this.currStrategy) {
      this.currStrategy.onDrag(e);
    } else {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
  }
  onEnd(e: PointerEvent, isDragHappened: boolean) {
    this.editor.controlHandleManager.showCustomHandles();

    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }

    if (!isDragHappened && this.graphShouldRemovedFromSelectedIfNotMoved) {
      this.editor.selectedElements.toggleItems([
        this.graphShouldRemovedFromSelectedIfNotMoved,
      ]);
      this.editor.render();
    }

    const currStrategy = this.currStrategy;
    if (currStrategy) {
      currStrategy.onEnd(e, isDragHappened);
      currStrategy.onInactive();
    } else {
      throw new Error('没有根据判断选择策略，代码有问题');
    }
  }
  afterEnd(e: PointerEvent, isDragHappened: boolean) {
    if (!this.editor.hostEventManager.isDraggingCanvasBySpace) {
      this.editor.setCursor('default');
    }
    this.graphShouldRemovedFromSelectedIfNotMoved = null;
    this.currStrategy?.afterEnd(e, isDragHappened);
    this.currStrategy = null;

    const point = this.editor.getSceneCursorXY(e);
    this.editor.selectedBox.setHoverByPoint(point);
    this.updateCursorAndHlHoverGraph(point);
  }

  onCanvasDragActiveChange(active: boolean) {
    // drag canvas action active
    if (active) {
      this.editor.selectedElements.setHoverItem(null);
    }
    // TODO: resetHoverItem after drag canvas end
  }

  onSpaceToggle(isSpacePressing: boolean) {
    if (this.currStrategy?.onSpaceToggle) {
      this.currStrategy.onSpaceToggle(isSpacePressing);
    }
  }

  onShiftToggle(isShiftPressing: boolean) {
    if (this.currStrategy?.onShiftToggle) {
      this.currStrategy.onShiftToggle(isShiftPressing);
    }
  }
}
