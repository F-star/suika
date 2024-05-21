import { getRectByTwoPoint, type IPoint } from '@suika/geo';

import { type Editor } from '../../editor';
import { type Graph } from '../../graphs';
import { SnapHelper } from '../../snap';
import { type IBaseTool } from '../type';

/**
 * draw selection box
 */
export class DrawSelection implements IBaseTool {
  private startPoint: IPoint = { x: -1, y: -1 };
  private isShiftPressingWhenStart = false;
  private startSelectedGraphs: Graph[] = [];
  private startPointWhenSpaceDown: IPoint | null = null;
  private lastDragPointWhenSpaceDown: IPoint | null = null;
  private lastMouseScenePoint!: IPoint;
  private lastMousePoint!: IPoint;

  constructor(private editor: Editor) {}
  onActive() {
    // noop
  }
  onInactive() {
    // noop
  }
  onStart(e: PointerEvent) {
    this.isShiftPressingWhenStart = false;

    if (this.editor.hostEventManager.isShiftPressing) {
      this.isShiftPressingWhenStart = true;
      this.startSelectedGraphs = this.editor.selectedElements.getItems();
    } else {
      this.editor.selectedElements.clear();
    }

    this.startPoint = SnapHelper.getSnapPtBySetting(
      this.editor.getSceneCursorXY(e),
      this.editor.setting,
    );

    this.editor.render();
    this.editor.sceneGraph.setSelection(this.startPoint);
  }
  onDrag(e: PointerEvent) {
    this.lastMouseScenePoint = this.editor.getSceneCursorXY(e);

    this.lastMousePoint = SnapHelper.getSnapPtBySetting(
      this.lastMouseScenePoint,
      this.editor.setting,
    );

    this.updateSelection();
  }

  private updateSelection() {
    const { x, y } = this.lastMouseScenePoint;

    if (this.startPointWhenSpaceDown && this.lastDragPointWhenSpaceDown) {
      const { x: sx, y: sy } = this.startPointWhenSpaceDown;
      const { x: lx, y: ly } = this.lastDragPointWhenSpaceDown;
      const dx = x - lx;
      const dy = y - ly;
      this.startPoint = {
        x: sx + dx,
        y: sy + dy,
      };
    }

    const box = getRectByTwoPoint(this.startPoint, this.lastMouseScenePoint);
    this.editor.sceneGraph.setSelection(box);

    const graphsInSelection = this.editor.sceneGraph.getElementsInSelection();

    if (this.isShiftPressingWhenStart) {
      this.editor.selectedElements.setItems(this.startSelectedGraphs);
      this.editor.selectedElements.toggleItems(graphsInSelection);
    } else {
      this.editor.selectedElements.setItems(graphsInSelection);
    }

    this.editor.render();
  }
  onEnd() {
    // noop
  }
  afterEnd() {
    this.isShiftPressingWhenStart = false;
    this.startSelectedGraphs = [];
    this.editor.sceneGraph.selection = null;
    this.editor.render();
    this.startPointWhenSpaceDown = null;
    this.lastDragPointWhenSpaceDown = null;
  }

  onSpaceToggle(isSpacePressing: boolean) {
    if (this.editor.toolManager.isDragging() && isSpacePressing) {
      this.startPointWhenSpaceDown = this.startPoint;
      this.lastDragPointWhenSpaceDown = this.lastMousePoint;
      this.updateSelection();
    } else {
      this.startPointWhenSpaceDown = null;
      this.lastDragPointWhenSpaceDown = null;
    }
  }
}
