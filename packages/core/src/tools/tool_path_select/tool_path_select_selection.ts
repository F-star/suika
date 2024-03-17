import { getRectByTwoPoint } from '@suika/geo';

import { type Editor } from '../../editor';
import {
  type ISelectedIdxInfo,
  type SelectedIdexType,
} from '../../path_editor';
import { type IPoint } from '../../type';
import { type IBaseTool } from '../type';

/**
 * draw selection box
 */
export class DrawPathSelectionTool implements IBaseTool {
  private lastPoint: IPoint = { x: -1, y: -1 };
  private isShiftPressingWhenStart = false;
  private startSelectedIdxInfo: ISelectedIdxInfo[] = [];

  constructor(private editor: Editor) {}
  onActive() {
    // noop
  }
  onInactive() {
    // noop
  }
  onStart() {
    this.isShiftPressingWhenStart = false;

    if (this.editor.hostEventManager.isShiftPressing) {
      this.isShiftPressingWhenStart = true;
      this.startSelectedIdxInfo = this.editor.pathEditor.getSelectedIndices();
    } else {
      this.editor.pathEditor.clearSelectedIndices();
      this.editor.pathEditor.updateControlHandles();
    }

    this.lastPoint = this.editor.toolManager.getCurrPoint();

    this.editor.render();
    this.editor.sceneGraph.setSelection(this.lastPoint);
  }
  onDrag(e: PointerEvent) {
    const point = this.editor.getSceneCursorXY(e);

    const box = getRectByTwoPoint(this.lastPoint, point);
    this.editor.sceneGraph.setSelection(box);

    const controls =
      this.editor.controlHandleManager.getCustomHandlesIntersectedWithRect(box);

    const info: ISelectedIdxInfo[] = controls
      .filter((control) => control.type.startsWith('anchor-'))
      .map((control) => {
        const strs = control.type.split('-');
        return {
          type: strs[0] as SelectedIdexType,
          pathIdx: parseInt(strs[1]),
          segIdx: parseInt(strs[2]),
        };
      });

    if (this.isShiftPressingWhenStart) {
      this.editor.pathEditor.setSelectedIndices([
        ...this.startSelectedIdxInfo,
        ...info,
      ]);
      this.editor.pathEditor.updateControlHandles();
    } else {
      this.editor.pathEditor.setSelectedIndices(info);
      this.editor.pathEditor.updateControlHandles();
    }

    this.editor.render();
  }
  onEnd() {
    // noop
  }
  afterEnd() {
    this.isShiftPressingWhenStart = false;
    this.startSelectedIdxInfo = [];
    this.editor.sceneGraph.selection = null;
    this.editor.render();
  }
}
