import { getRectByTwoPoint, type IPoint } from '@suika/geo';

import { type SuikaEditor } from '../../editor';
import { type SuikaGraphics } from '../../graphs';
import { getParentIdSet } from '../../utils';
import { type IBaseTool } from '../type';
import { getElementsInSelection } from './utils';

/**
 * draw selection box
 */
export class DrawSelection implements IBaseTool {
  private startPoint: IPoint = { x: -1, y: -1 };
  private isShiftPressingWhenStart = false;
  private startSelectedGraphs: SuikaGraphics[] = [];
  private startPointWhenSpaceDown: IPoint | null = null;
  private lastDragPointWhenSpaceDown: IPoint | null = null;
  private lastMouseScenePoint!: IPoint;
  private lastMousePoint!: IPoint;

  constructor(private editor: SuikaEditor) {}
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

    this.startPoint = this.editor.getSceneCursorXY(e);

    this.editor.render();
    this.editor.sceneGraph.setSelection(this.startPoint);
  }
  onDrag(e: PointerEvent) {
    this.lastMouseScenePoint = this.editor.getSceneCursorXY(e);

    this.lastMousePoint = this.lastMouseScenePoint;

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

    if (this.isShiftPressingWhenStart) {
      const parentIdSet = getParentIdSet(this.startSelectedGraphs);

      const graphsInSelection = getElementsInSelection(
        this.editor,
        parentIdSet,
      );
      this.editor.selectedElements.setItems(this.startSelectedGraphs);
      this.editor.selectedElements.toggleItems(
        graphsInSelection.filter((item) => !parentIdSet.has(item.attrs.id)),
      );
    } else {
      const graphsInSelection = getElementsInSelection(this.editor);
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
