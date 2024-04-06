import { arrEvery, arrMap, noop, omit } from '@suika/common';
import { getRectApplyMatrix, type IRect, resizeRect } from '@suika/geo';

import { SetGraphsAttrsCmd } from '../../commands/set_elements_attrs';
import { isTransformHandle } from '../../control_handle_manager';
import { type Editor } from '../../editor';
import { type GraphAttrs } from '../../graphs';
import { type IPoint } from '../../type';
import { type IBaseTool } from '../type';

/**
 * scale element
 */
export class SelectResizeTool implements IBaseTool {
  private startPoint: IPoint = { x: -1, y: -1 };
  private handleName!: string;
  private startSelectBbox: IRect | null = null;
  private prevGraphsAttrs: GraphAttrs[] = [];
  /** offset of left-top of startSelectBbox */
  private graphOffsets: IPoint[] = [];
  private isGraphsRotateAllZero = false;
  private lastPoint: IPoint | null = null;
  private unbind = noop;

  constructor(private editor: Editor) {}

  onActive() {
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
  onInactive() {
    this.unbind();
    this.unbind = noop;
  }
  onStart(e: PointerEvent) {
    this.startPoint = this.editor.getSceneCursorXY(e);
    const handleInfo = this.editor.controlHandleManager.getHandleInfoByPoint(
      this.startPoint,
    );
    if (!handleInfo) {
      throw new Error(`handleName is invalid`);
    }

    const selectedItems = this.editor.selectedElements.getItems();

    this.prevGraphsAttrs = arrMap(selectedItems, (item) => item.getAttrs());
    this.isGraphsRotateAllZero = arrEvery(
      selectedItems,
      (item) => item.getRotate() === 0,
    );
    const startSelectBbox = this.editor.selectedElements.getBBox();
    if (!startSelectBbox) {
      throw new Error('startSelectBbox should not be null, please issue to us');
    }
    this.startSelectBbox = startSelectBbox;
    this.graphOffsets = arrMap(selectedItems, (item) => ({
      x: item.getX() - startSelectBbox.x,
      y: item.getY() - startSelectBbox.y,
    }));

    if (isTransformHandle(handleInfo.handleName)) {
      this.editor.controlHandleManager.hideCustomHandles();
    }
    this.handleName = handleInfo.handleName;
  }
  onDrag(e: PointerEvent) {
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
      // multi elements case
      if (!this.startSelectBbox) {
        throw new Error(
          'startSelectBbox should not be null, please issue to us',
        );
      }

      // force keep width height ratio, if graphs rotate has no zero
      const keepRatio = this.isGraphsRotateAllZero
        ? this.editor.hostEventManager.isShiftPressing
        : true;
      const newSelectBbox = getRectApplyMatrix(
        resizeRect(
          this.handleName,
          this.lastPoint,
          {
            width: this.startSelectBbox.width,
            height: this.startSelectBbox.height,
            transform: [
              1,
              0,
              0,
              1,
              this.startSelectBbox.x,
              this.startSelectBbox.y,
            ],
          },
          {
            keepRatio,
            scaleFromCenter: this.editor.hostEventManager.isAltPressing,
          },
        ),
      );

      const widthRatio = newSelectBbox.width / this.startSelectBbox.width;
      const heightRatio = newSelectBbox.height / this.startSelectBbox.height;

      for (let i = 0; i < selectItems.length; i++) {
        const graph = selectItems[i];
        const x = newSelectBbox.x + this.graphOffsets[i].x * widthRatio;
        const y = newSelectBbox.y + this.graphOffsets[i].y * heightRatio;
        const tf = graph.attrs.transform;
        graph.updateAttrs({
          width: this.prevGraphsAttrs[i].width * widthRatio,
          height: this.prevGraphsAttrs[i].height * heightRatio,
          transform: [tf[0], tf[1], tf[2], tf[3], x, y],
        });
      }
    }

    this.editor.render();
  }
  onEnd(_e: PointerEvent, isDragHappened: boolean) {
    if (this.editor.selectedElements.size() === 0 || !isDragHappened) {
      return;
    }
    const items = this.editor.selectedElements.getItems();
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Scale Selected Graphs',
        items,
        arrMap(items, (item) => omit(item.getAttrs(), 'x', 'y')),
        this.prevGraphsAttrs.map((item) => omit(item, 'x', 'y')),
      ),
    );

    // update custom control handles
    if (items.length === 1) {
      this.editor.controlHandleManager.setCustomHandles(
        items[0].getControlHandles(this.editor.zoomManager.getZoom(), true),
      );
      this.editor.render();
    }
    this.editor.commandManager.enableRedoUndo();
    this.editor.hostEventManager.enableDelete();
  }
  afterEnd() {
    this.prevGraphsAttrs = [];
    this.lastPoint = null;
  }
}
