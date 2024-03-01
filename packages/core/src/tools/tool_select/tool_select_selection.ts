import { getRectByTwoPoint } from '@suika/geo';

import { Editor } from '../../editor';
import { Graph } from '../../graphs';
import { IPoint } from '../../type';
import { IBaseTool } from '../type';

/**
 * draw selection box
 */
export class DrawSelectionBox implements IBaseTool {
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
    this.editor.sceneGraph.setSelection(this.lastPoint);
  }
  onDrag(e: PointerEvent) {
    const point = this.editor.getSceneCursorXY(e);

    const box = getRectByTwoPoint(this.lastPoint, point);
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
  }
}
