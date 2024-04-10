import { arrMap, noop, omit } from '@suika/common';
import {
  type IMatrixArr,
  type IRect,
  recomputeTransformRect,
  resizeRect,
} from '@suika/geo';
import { Matrix } from 'pixi.js';

import { SetGraphsAttrsCmd } from '../../commands/set_elements_attrs';
import { isTransformHandle } from '../../control_handle_manager';
import { type Editor } from '../../editor';
import { type Graph, type GraphAttrs } from '../../graphs';
import { type IPoint } from '../../type';
import { type IBaseTool } from '../type';

/**
 * scale element
 */
export class SelectResizeTool implements IBaseTool {
  private startPoint: IPoint = { x: -1, y: -1 };
  private handleName!: string;
  private startSelectBbox: IRect | null = null;
  private startGraphsAttrs: GraphAttrs[] = [];
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

    this.startGraphsAttrs = arrMap(selectedItems, (item) => item.getAttrs());
    const startSelectBbox = this.editor.selectedElements.getBBox();
    if (!startSelectBbox) {
      throw new Error('startSelectBbox should not be null, please issue to us');
    }
    this.startSelectBbox = startSelectBbox;

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
        this.startGraphsAttrs[0],
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
      this.resizeMultiGraphs(selectItems);
    }

    this.editor.render();
  }

  private resizeMultiGraphs(selectItems: Graph[]) {
    if (!this.lastPoint) return;

    // multi elements case
    if (!this.startSelectBbox) {
      throw new Error('startSelectBbox should not be null, please issue to us');
    }

    const startTransform: IMatrixArr = [
      1,
      0,
      0,
      1,
      this.startSelectBbox.x,
      this.startSelectBbox.y,
    ];
    const transformRect = resizeRect(
      this.handleName,
      this.lastPoint,
      {
        width: this.startSelectBbox.width,
        height: this.startSelectBbox.height,
        transform: startTransform,
      },
      {
        keepRatio: this.editor.hostEventManager.isShiftPressing,
        scaleFromCenter: this.editor.hostEventManager.isAltPressing,
        noChangeWidthAndHeight: true,
      },
    );

    const scaleTf = new Matrix(...transformRect.transform).append(
      new Matrix(...startTransform).invert(),
    );

    for (let i = 0; i < selectItems.length; i++) {
      const startAttrs = this.startGraphsAttrs[i];
      const graph = selectItems[i];

      const tf = new Matrix(...this.startGraphsAttrs[i].transform).prepend(
        scaleTf,
      );
      graph.updateAttrs(
        recomputeTransformRect({
          width: startAttrs.width,
          height: startAttrs.height,
          transform: [tf.a, tf.b, tf.c, tf.d, tf.tx, tf.ty],
        }),
      );
    }
  }

  onEnd(_e: PointerEvent, isDragHappened: boolean) {
    if (this.editor.selectedElements.size() === 0 || !isDragHappened) {
      return;
    }
    const items = this.editor.selectedElements.getItems();
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Selected Graphs by Control Handle',
        items,
        arrMap(items, (item) => omit(item.getAttrs(), 'x', 'y')),
        this.startGraphsAttrs.map((item) => omit(item, 'x', 'y')),
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
    this.startGraphsAttrs = [];
    this.lastPoint = null;
  }
}
