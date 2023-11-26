import { IPoint } from '../../../type';
import { arrMap } from '../../../utils/array_util';
import { noop } from '../../../utils/common';
import { SetElementsAttrs } from '../../commands/set_elements_attrs';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';
import { isTransformHandle } from '../../scene/control_handle_manager';
import { GraphAttrs } from '../../scene/graph';

/**
 * scale element
 */
export class SelectResizeTool implements IBaseTool {
  private startPoint: IPoint = { x: -1, y: -1 };
  private handleName!: string;
  private prevGraphsAttrs: Array<GraphAttrs> = [];
  private lastPoint: IPoint | null = null;
  private unbind = noop;

  constructor(private editor: Editor) {}

  active() {
    const handler = () => {
      this.resize();
    };
    this.editor.hostEventManager.on('shiftToggle', handler);
    this.editor.hostEventManager.on('altToggle', handler);

    this.unbind = () => {
      this.editor.hostEventManager.off('shiftToggle', handler);
      this.editor.hostEventManager.off('altToggle', handler);
    };
  }
  inactive() {
    this.unbind();
    this.unbind = noop;
  }
  start(e: PointerEvent) {
    this.startPoint = this.editor.getSceneCursorXY(e);
    const handleInfo = this.editor.controlHandleManager.getHandleInfoByPoint(
      this.startPoint,
    );

    this.prevGraphsAttrs = arrMap(
      this.editor.selectedElements.getItems(),
      (item) => item.getAttrs(),
    );
    if (!handleInfo) {
      throw new Error(`handleName is invalid`);
    }

    if (isTransformHandle(handleInfo.handleName)) {
      this.editor.controlHandleManager.hideCustomHandles();
    }
    this.handleName = handleInfo.handleName;
  }
  drag(e: PointerEvent) {
    this.editor.commandManager.disableRedoUndo();
    this.editor.hostEventManager.disableDelete();

    this.lastPoint = this.editor.getSceneCursorXY(e);
    this.resize();
  }
  private resize() {
    if (!this.lastPoint) return;

    const selectItems = this.editor.selectedElements.getItems();
    if (selectItems.length === 1) {
      selectItems[0].updateByControlHandle(
        this.handleName,
        this.lastPoint,
        this.prevGraphsAttrs[0],
        this.editor.hostEventManager.isShiftPressing,
        this.editor.hostEventManager.isAltPressing,
      );

      const controlHandleManager = this.editor.controlHandleManager;
      // update custom control handles
      if (
        !isTransformHandle(this.handleName) &&
        controlHandleManager.hasCustomHandles()
      ) {
        const controlHandle = selectItems[0].getControlHandles(
          this.editor.zoomManager.getZoom(),
        );
        if (controlHandle) {
          controlHandleManager.setCustomHandles(controlHandle);
        }
      }
    } else {
      // TODO: multi elements case
    }

    this.editor.sceneGraph.render();
  }
  end(e: PointerEvent, isDragHappened: boolean) {
    if (this.editor.selectedElements.size() === 0 || !isDragHappened) {
      return;
    }
    const items = this.editor.selectedElements.getItems();
    this.editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'scale select elements',
        items,
        arrMap(items, (item) => item.getAttrs()),
        this.prevGraphsAttrs,
      ),
    );

    // update custom control handles
    if (items.length === 1) {
      this.editor.controlHandleManager.setCustomHandles(
        items[0].getControlHandles(this.editor.zoomManager.getZoom(), true),
      );
      this.editor.sceneGraph.render();
    }
    this.editor.commandManager.enableRedoUndo();
    this.editor.hostEventManager.enableDelete();
  }
  afterEnd() {
    this.prevGraphsAttrs = [];
    this.lastPoint = null;
  }
}
