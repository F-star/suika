import { noop } from '@suika/common';

import { MoveGraphsCommand } from '../../commands/move_graphs';
import { Editor } from '../../editor';
import { IPoint } from '../../type';
import { IBaseTool } from '../type';

/**
 * select tool
 *
 * move selected elements
 */
export class SelectMoveTool implements IBaseTool {
  private startPoint: IPoint = { x: -1, y: -1 };
  private startPoints: IPoint[] = [];
  private dragPoint: IPoint | null = null;
  private dx = 0;
  private dy = 0;
  private prevBBoxPos: IPoint = { x: -1, y: -1 };

  unbindEvents = noop;

  constructor(private editor: Editor) {}
  onActive() {
    const hotkeysManager = this.editor.hostEventManager;
    const moveWhenToggleShift = () => {
      if (this.dragPoint) {
        this.move();
      }
    };
    hotkeysManager.on('shiftToggle', moveWhenToggleShift);
    this.unbindEvents = () => {
      hotkeysManager.off('shiftToggle', moveWhenToggleShift);
    };
  }
  onInactive() {
    this.unbindEvents();
  }
  onStart(e: PointerEvent) {
    this.editor.controlHandleManager.hideCustomHandles();

    this.startPoint = this.editor.getSceneCursorXY(e);
    const selectedElements = this.editor.selectedElements.getItems({
      excludeLocked: true,
    });
    this.startPoints = selectedElements.map((graph) => {
      const rect = graph.getRect();
      return {
        x: rect.x,
        y: rect.y,
      };
    });
    const bBox = this.editor.selectedElements.getBBox();
    if (!bBox) {
      console.error(
        "selected elements should't be empty when moving, please report us issue",
      );
    } else {
      this.prevBBoxPos = { x: bBox.x, y: bBox.y };
    }

    this.editor.refLine.cacheXYToBbox();
  }
  onDrag(e: PointerEvent) {
    this.dragPoint = this.editor.getCursorXY(e);
    this.move();
  }
  private move() {
    this.editor.sceneGraph.showBoxAndHandleWhenSelected = false;
    this.editor.sceneGraph.showSelectedGraphsOutline = false;

    const { x, y } = this.editor.viewportCoordsToScene(
      this.dragPoint!.x,
      this.dragPoint!.y,
    );

    let dx = (this.dx = x - this.startPoint.x);
    let dy = (this.dy = y - this.startPoint.y);

    if (this.editor.hostEventManager.isShiftPressing) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }

    // in the moving phase, AABBox's x and y should round to be integer (snap to pixel grid)
    if (this.editor.setting.get('snapToPixelGrid')) {
      // if dx == 0, we thing it is in vertical moving.
      if (dx !== 0)
        dx = Math.round(this.prevBBoxPos.x + dx) - this.prevBBoxPos.x;
      // similarly dy
      if (dy !== 0)
        dy = Math.round(this.prevBBoxPos.y + dy) - this.prevBBoxPos.y;
    }

    const selectedElements = this.editor.selectedElements.getItems({
      excludeLocked: true,
    });
    const startPoints = this.startPoints;
    for (let i = 0, len = selectedElements.length; i < len; i++) {
      selectedElements[i].updateAttrs({
        x: startPoints[i].x + dx,
        y: startPoints[i].y + dy,
      });
    }

    // 参照线处理（目前不处理 “吸附到像素网格的情况” 的特殊情况）

    const { offsetX, offsetY } = this.editor.refLine.updateRefLine();

    for (let i = 0, len = selectedElements.length; i < len; i++) {
      selectedElements[i].updateAttrs({
        x: startPoints[i].x + dx + offsetX,
        y: startPoints[i].y + dy + offsetY,
      });
    }

    this.editor.sceneGraph.render();
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
      const topHitElement = this.editor.sceneGraph.getTopHitElement(
        point.x,
        point.y,
      );
      if (!topHitElement && !this.editor.hostEventManager.isShiftPressing) {
        this.editor.selectedElements.clear();
      }
      return;
    }

    if (this.dx !== 0 || this.dy !== 0) {
      this.editor.commandManager.pushCommand(
        new MoveGraphsCommand('Move Elements', selectedItems, this.dx, this.dy),
      );

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
    this.dragPoint = null;

    this.editor.sceneGraph.showBoxAndHandleWhenSelected = true;
    this.editor.sceneGraph.showSelectedGraphsOutline = true;
    this.editor.refLine.clear();
    this.editor.sceneGraph.render();
  }
}
