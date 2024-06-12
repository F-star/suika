import { cloneDeep, isEqual, noop } from '@suika/common';
import {
  type IMatrixArr,
  invertMatrix,
  type IPoint,
  type IRect,
  type ITransformRect,
  Matrix,
  multiplyMatrix,
  recomputeTransformRect,
  resizeRect,
} from '@suika/geo';

import { UpdateGraphicsAttrsCmd } from '../../commands';
import { HALF_PI } from '../../constant';
import { isTransformHandle } from '../../control_handle_manager';
import { type Editor } from '../../editor';
import { type GraphicsAttrs, type SuikaGraphics } from '../../graphs';
import {
  getChildNodeSet,
  getParentIdSet,
} from '../../service/group_and_record';
import { SnapHelper } from '../../snap';
import { type IBaseTool } from '../type';
import { updateParentSize } from './utils';

/**
 * scale element
 */
export class SelectResizeTool implements IBaseTool {
  private startPoint: IPoint = { x: -1, y: -1 };
  private handleName!: string;
  private startSelectBRect: IRect | null = null;

  private originAttrsMap = new Map<string, GraphicsAttrs>();
  private originWorldTransforms = new Map<string, IMatrixArr>();
  private childNodeSet = new Set<SuikaGraphics>();

  private updatedAttrsMap = new Map<string, Partial<GraphicsAttrs>>();

  private lastPoint: IPoint | null = null;
  private prevLastPoint: IPoint | null = null;
  private unbind = noop;

  constructor(private editor: Editor) {}

  onActive() {
    const handler = () => {
      this.updateGraphics();
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

    selectedItems.forEach((item) => {
      this.originAttrsMap.set(item.attrs.id, item.getAttrs());
      this.originWorldTransforms.set(item.attrs.id, [
        ...item.getWorldTransform(),
      ]);
    });

    this.childNodeSet = getChildNodeSet(selectedItems);
    for (const item of this.childNodeSet) {
      this.originAttrsMap.set(item.attrs.id, item.getAttrs());
      this.originWorldTransforms.set(item.attrs.id, [
        ...item.getWorldTransform(),
      ]);
    }

    const startSelectBRect = this.editor.selectedElements.getBoundingRect();
    if (!startSelectBRect) {
      throw new Error('startSelectBbox should not be null, please issue to us');
    }
    this.startSelectBRect = startSelectBRect;

    if (isTransformHandle(handleInfo.handleName)) {
      this.editor.controlHandleManager.hideCustomHandles();
    }
    this.handleName = handleInfo.handleName;
  }
  onDrag(e: PointerEvent) {
    this.editor.commandManager.disableRedoUndo();
    this.editor.hostEventManager.disableDelete();

    const enableGripSnap =
      this.editor.setting.get('snapToGrid') &&
      (['nw', 'ne', 'se', 'sw'].includes(this.handleName) ||
        (['n', 'e', 's', 'w'].includes(this.handleName) &&
          this.editor.selectedElements.size() > 1) ||
        this.editor.selectedElements.getItems()[0].getRotate() % HALF_PI === 0);

    this.lastPoint = this.editor.getSceneCursorXY(e);
    if (enableGripSnap) {
      this.lastPoint = SnapHelper.getSnapPtBySetting(
        this.lastPoint,
        this.editor.setting,
      );
    }

    const prevLastPoint = this.prevLastPoint;
    this.prevLastPoint = this.lastPoint;
    if (isEqual(prevLastPoint, this.lastPoint)) {
      return;
    }

    this.updateGraphics();
    this.editor.render();
  }

  private checkEnableUpdate(
    originAttrs: ITransformRect,
    updatedAttrs: ITransformRect,
  ) {
    if (
      (updatedAttrs.width === 0 || updatedAttrs?.transform?.[0] === 0) &&
      (updatedAttrs.height === 0 || updatedAttrs?.transform?.[3] === 0)
    ) {
      return false;
    }

    const isLineLikeGraph = originAttrs.width === 0 || originAttrs.height === 0;
    if (
      !isLineLikeGraph &&
      (updatedAttrs.width === 0 ||
        updatedAttrs.height === 0 ||
        (updatedAttrs.transform &&
          (updatedAttrs.transform[0] === 0 || updatedAttrs.transform[3]) === 0))
    ) {
      return false;
    }
    return true;
  }

  private updateSingleGraphicsWithNoResize(graphics: SuikaGraphics) {
    const updatedAttrs = graphics.calcNewAttrsByControlHandle(
      this.handleName,
      this.lastPoint!,
      this.originAttrsMap.get(graphics.attrs.id)!,
      this.originWorldTransforms.get(graphics.attrs.id)!,
      this.editor.hostEventManager.isShiftPressing,
      this.editor.hostEventManager.isAltPressing,
      this.editor.setting.get('flipObjectsWhileResizing'),
    );

    graphics.updateAttrs(updatedAttrs, {
      finishRecomputed: true,
    });
    this.updatedAttrsMap.set(graphics.attrs.id, cloneDeep(updatedAttrs));

    this.updateControls(graphics);
  }

  private isResizeOp = () => {
    return ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'].includes(
      this.handleName,
    );
  };

  private updateControls = (graphics: SuikaGraphics) => {
    const controlHandleManager = this.editor.controlHandleManager;
    if (
      !isTransformHandle(this.handleName) &&
      controlHandleManager.hasCustomHandles()
    ) {
      const controlHandle = graphics.getControlHandles(
        this.editor.zoomManager.getZoom(),
      );
      if (controlHandle) {
        controlHandleManager.setCustomHandles(controlHandle);
      }
    }
  };

  private updateGraphics() {
    if (!this.lastPoint) return;

    let prependedTransform: Matrix = new Matrix();

    const selectedElements = this.editor.selectedElements.getItems();
    if (selectedElements.length === 1) {
      // 非 resize 操作，比如修改矩形的圆角，修改直线的端点位置
      if (!this.isResizeOp() || selectedElements[0].attrs.height === 0) {
        this.updateSingleGraphicsWithNoResize(selectedElements[0]);
        return;
      }

      const originWorldTf = this.originWorldTransforms.get(
        selectedElements[0].attrs.id,
      )!;

      const originAttrs = this.originAttrsMap.get(
        selectedElements[0].attrs.id,
      )!;

      const updatedTransformRect = resizeRect(
        this.handleName,
        this.lastPoint,
        {
          width: originAttrs.width,
          height: originAttrs.height,
          transform: originWorldTf,
        },
        {
          keepRatio: this.editor.hostEventManager.isShiftPressing,
          scaleFromCenter: this.editor.hostEventManager.isAltPressing,
          noChangeWidthAndHeight: true,
          flip: this.editor.setting.get('flipObjectsWhileResizing'),
        },
      );

      if (
        !this.checkEnableUpdate(
          originAttrs,
          recomputeTransformRect(updatedTransformRect) as ITransformRect,
        )
      ) {
        return;
      }
      prependedTransform = new Matrix(...updatedTransformRect.transform).append(
        new Matrix(...originWorldTf).invert(),
      );

      this.updateControls(selectedElements[0]);
    } else {
      const startSelectBbox = this.startSelectBRect!;
      const startSelectedBoxTf = new Matrix().translate(
        startSelectBbox.x,
        startSelectBbox.y,
      );

      const transformRect = resizeRect(
        this.handleName,
        this.lastPoint,
        {
          width: startSelectBbox.width,
          height: startSelectBbox.height,
          transform: startSelectedBoxTf.getArray(),
        },
        {
          keepRatio: this.editor.hostEventManager.isShiftPressing,
          scaleFromCenter: this.editor.hostEventManager.isAltPressing,
          noChangeWidthAndHeight: true,
          flip: this.editor.setting.get('flipObjectsWhileResizing'),
        },
      );

      prependedTransform = new Matrix(...transformRect.transform).append(
        startSelectedBoxTf.clone().invert(),
      );
    }

    if (this.isResizeOp()) {
      this.resizeGraphicsArray(prependedTransform.getArray());
    } else {
      console.error('should reach here, please put a issue');
    }
  }

  private resizeGraphicsArray(prependedTransform: IMatrixArr) {
    const selectedItems = this.editor.selectedElements.getItems();
    for (const item of selectedItems) {
      const id = item.attrs.id;
      const originWorldTf = this.originWorldTransforms.get(id)!;
      const newWorldTf = multiplyMatrix(prependedTransform, originWorldTf);
      const newLocalTf = multiplyMatrix(
        invertMatrix(item.getParentWorldTransform()),
        newWorldTf,
      );

      const { width, height } = this.originAttrsMap.get(id)!;
      const newAttrs = recomputeTransformRect({
        width,
        height,
        transform: newLocalTf,
      });
      item.updateAttrs(newAttrs);
      this.updatedAttrsMap.set(id, cloneDeep(newAttrs));
    }

    // 2. update children width/height/transform
    this.updateChildren(prependedTransform);

    // 3. update parents width/height/transform
    updateParentSize(
      this.editor,
      getParentIdSet(selectedItems),
      this.originAttrsMap,
      this.updatedAttrsMap,
    );
  }

  private updateChildren(prependedTransform: IMatrixArr) {
    for (const item of this.childNodeSet) {
      const id = item.attrs.id;
      const originWorldTf = this.originWorldTransforms.get(id)!;
      const newWorldTf = multiplyMatrix(prependedTransform, originWorldTf);
      const newLocalTf = multiplyMatrix(
        invertMatrix(item.getParentWorldTransform()),
        newWorldTf,
      );

      const { width, height } = this.originAttrsMap.get(id)!;
      const updatedAttrs = recomputeTransformRect({
        width,
        height,
        transform: newLocalTf,
      });
      item.updateAttrs(updatedAttrs);
      this.updatedAttrsMap.set(id, cloneDeep(updatedAttrs));
    }
  }

  onEnd(_e: PointerEvent, isDragHappened: boolean) {
    if (this.editor.selectedElements.size() === 0 || !isDragHappened) {
      return;
    }
    const items = this.editor.selectedElements.getItems();
    this.editor.commandManager.pushCommand(
      new UpdateGraphicsAttrsCmd(
        'Update Selected Graphics attributes by Control Handle',
        this.editor,
        this.originAttrsMap,
        this.updatedAttrsMap,
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
    this.originAttrsMap = new Map();
    this.updatedAttrsMap = new Map();

    this.lastPoint = null;
  }
}
