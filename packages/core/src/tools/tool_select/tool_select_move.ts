import { cloneDeep } from '@suika/common';
import { type IMatrixArr, type IPoint, type ITransformRect } from '@suika/geo';

import { type SuikaEditor } from '../../editor';
import {
  type IParentIndex,
  isFrameGraphics,
  type SuikaFrame,
  type SuikaGraphics,
} from '../../graphics';
import { type SuikaCanvas } from '../../graphics/canvas';
import { RefLine } from '../../ref_line';
import { Transaction } from '../../transaction';
import { getDeepFrameAtPoint } from '../../utils';
import { type IBaseTool } from '../type';
import { getTopHitElement } from './utils';

/**
 * select tool
 * sub case: move selected elements
 */
export class SelectMoveTool implements IBaseTool {
  private originWorldTfMap = new Map<string, IMatrixArr>();
  private originParentIndexMap = new Map<string, IParentIndex>();

  private transaction: Transaction;
  private selectedItems: SuikaGraphics[] = [];
  private selectedFrameIdSet = new Set<string>();
  private prevParent!: SuikaFrame | SuikaCanvas;

  private startPoint: IPoint = { x: -1, y: -1 };
  private dragPoint: IPoint | null = null;
  private dx = 0;
  private dy = 0;
  private prevBBoxPos: IPoint = { x: -1, y: -1 };

  constructor(private editor: SuikaEditor) {
    this.transaction = new Transaction(editor);
  }
  onActive() {
    // noop
  }
  onInactive() {
    // noop
  }
  onShiftToggle() {
    if (this.dragPoint) {
      this.move();
    }
  }
  onStart(e: PointerEvent) {
    this.editor.controlHandleManager.hideCustomHandles();

    this.startPoint = this.editor.getSceneCursorXY(e);
    this.selectedItems = this.editor.selectedElements.getItems({
      excludeLocked: true,
    });
    for (const item of this.selectedItems) {
      const id = item.attrs.id;
      if (isFrameGraphics(item) && !item.isGroup()) {
        this.selectedFrameIdSet.add(id);
      }
      this.transaction.recordOld(id, {
        transform: cloneDeep(item.attrs.transform),
        parentIndex: cloneDeep(item.attrs.parentIndex),
      });

      this.originWorldTfMap.set(id, item.getWorldTransform());
      this.originParentIndexMap.set(id, cloneDeep(item.attrs.parentIndex!));
    }

    const canvasGraphics = this.editor.doc.getCanvas();
    this.prevParent =
      getDeepFrameAtPoint(
        this.startPoint,
        canvasGraphics.getChildren(),
        (node) => this.selectedFrameIdSet.has(node.attrs.id),
      ) ?? canvasGraphics;

    const boundingRect = this.editor.selectedElements.getBoundingRect();
    if (!boundingRect) {
      console.error(
        "selected elements should't be empty when moving, please report us issue",
      );
    } else {
      this.prevBBoxPos = { x: boundingRect.x, y: boundingRect.y };
    }

    if (this.editor.setting.get('snapToObjects')) {
      this.editor.refLine.cacheGraphicsRefLines({
        excludeItems: this.selectedItems,
      });
    }
  }
  onDrag(e: PointerEvent) {
    this.dragPoint = this.editor.getCursorXY(e);
    this.move();
  }
  private move() {
    this.editor.sceneGraph.showBoxAndHandleWhenSelected = false;
    this.editor.sceneGraph.showSelectedGraphsOutline = false;

    const currPoint = this.editor.toScenePt(
      this.dragPoint!.x,
      this.dragPoint!.y,
    );

    let dx = currPoint.x - this.startPoint.x;
    let dy = currPoint.y - this.startPoint.y;

    if (this.editor.hostEventManager.isShiftPressing) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }

    // in the moving phase, AABBox's x and y should round to be integer (snap to pixel grid)
    if (this.editor.setting.get('snapToGrid')) {
      // if dx == 0, we thing it is in vertical moving.
      if (dx !== 0)
        dx = Math.round(this.prevBBoxPos.x + dx) - this.prevBBoxPos.x;
      // similarly dy
      if (dy !== 0)
        dy = Math.round(this.prevBBoxPos.y + dy) - this.prevBBoxPos.y;
    }
    this.dx = dx;
    this.dy = dy;

    const selectedItems = this.selectedItems;

    // 1. update graphics position
    const record = new Map<string, ITransformRect>();
    for (const graphics of selectedItems) {
      const newWorldTf = cloneDeep(
        this.originWorldTfMap.get(graphics.attrs.id)!,
      );
      newWorldTf[4] += dx;
      newWorldTf[5] += dy;

      record.set(graphics.attrs.id, {
        width: graphics.attrs.width,
        height: graphics.attrs.height,
        transform: newWorldTf,
      });
    }

    const targetPoints = RefLine.getGraphicsTargetPoints(record);
    const offset = this.editor.refLine.getGraphicsSnapOffset(targetPoints);

    const canvasGraphics = this.editor.doc.getCanvas();
    const newParent =
      getDeepFrameAtPoint(currPoint, canvasGraphics.getChildren(), (node) =>
        this.selectedFrameIdSet.has(node.attrs.id),
      ) ?? canvasGraphics;
    const newParentId = newParent.attrs.id;

    // 2. snap to ref line
    for (const graphics of selectedItems) {
      const newWorldTf = cloneDeep(
        this.originWorldTfMap.get(graphics.attrs.id)!,
      );
      newWorldTf[4] += dx + offset.x;
      newWorldTf[5] += dy + offset.y;

      // change parent
      if (this.prevParent !== newParent) {
        if (graphics.attrs.id !== newParentId) {
          if (graphics.getParentId() === newParentId) {
            graphics.updateAttrs({
              parentIndex: {
                guid: newParentId,
                position: graphics.attrs.parentIndex!.position,
              },
            });
          } else {
            newParent.insertChild(graphics); // FIXME: should insert after prev parent position
          }
        }
      }
      graphics.setWorldTransform(newWorldTf);
    }
    this.prevParent = newParent;

    // 3. record update attrs
    for (const graphics of selectedItems) {
      this.transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
        parentIndex: cloneDeep(graphics.attrs.parentIndex),
      });
    }

    // 4. update cursor
    this.updateCursor();

    this.transaction.updateParentSize(selectedItems);

    this.editor.render();
  }

  private updateCursor() {
    if (this.editor.hostEventManager.isShiftPressing) {
      if (this.dx === 0 && this.dy !== 0) {
        this.editor.setCursor('move-ns');
        return;
      }
      if (this.dx !== 0 && this.dy === 0) {
        this.editor.setCursor('move-ew');
        return;
      }
    }
    this.editor.setCursor('default');
  }

  onEnd(e: PointerEvent, isDragHappened: boolean) {
    const selectedItems = this.editor.selectedElements.getItems({
      excludeLocked: true,
    });
    if (selectedItems.length === 0) {
      // 移动的时候元素被删除了，或者撤销导致为空
      // TODO: 属性复原
      return;
    }
    if (!isDragHappened) {
      // clear selected elements if click on blank area and not dragging
      const point = this.editor.getSceneCursorXY(e);
      const topHitElement = getTopHitElement(this.editor, point);
      if (!topHitElement && !this.editor.hostEventManager.isShiftPressing) {
        this.editor.selectedElements.clear();
      }
      return;
    }

    if (this.dx !== 0 || this.dy !== 0) {
      this.transaction.commit('Update Graphics Attributes');

      // update custom control handles
      if (selectedItems.length === 1) {
        this.editor.controlHandleManager.setCustomHandles(
          selectedItems[0].getControlHandles(
            this.editor.zoomManager.getZoom(),
            true,
          ),
        );
      }
    }
  }
  afterEnd() {
    this.transaction = new Transaction(this.editor);
    this.dragPoint = null;
    this.selectedFrameIdSet.clear();

    this.editor.sceneGraph.showBoxAndHandleWhenSelected = true;
    this.editor.sceneGraph.showSelectedGraphsOutline = true;
    this.editor.refLine.clear();
    this.editor.render();
  }
}
