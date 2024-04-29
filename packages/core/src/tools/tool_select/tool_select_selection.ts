import { getRectByTwoPoint, type IPoint } from '@suika/geo';

import { type Editor } from '../../editor';
import { type Graph } from '../../graphs';
import { type IBaseTool } from '../type';

/**
 * draw selection box
 */
export class DrawSelection implements IBaseTool {
  private lastPoint: IPoint = { x: -1, y: -1 };
  private isShiftPressingWhenStart = false;
  private startSelectedGraphs: Graph[] = [];

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

    const pos = this.editor.getCursorXY(e);
    this.lastPoint = this.editor.viewportCoordsToScene(pos.x, pos.y);

    this.editor.render();
    // this.editor.sceneGraph.setSelection(this.lastPoint);
    this.editor.selection.setRect({
      ...this.lastPoint,
      width: 0,
      height: 0,
    });
  }
  onDrag(e: PointerEvent) {
    const point = this.editor.getSceneCursorXY(e);

    const rect = getRectByTwoPoint(this.lastPoint, point);
    this.editor.selection.setRect(rect);

    const graphsInSelection = this.editor.selection.getElementsInSelection();

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
    // this.editor.sceneGraph.selection = null;
    this.editor.selection.clear();
    this.editor.render();
  }
}
