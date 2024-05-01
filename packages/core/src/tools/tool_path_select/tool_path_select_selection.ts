import { getRectByTwoPoint, type IPoint } from '@suika/geo';

import { type Editor } from '../../editor';
import {
  type ISelectedIdxInfo,
  type SelectedIdexType,
} from '../../path_editor';
import { type IBaseTool } from '../type';

/**
 * draw selection box
 */
export class DrawPathSelectionTool implements IBaseTool {
  private lastPoint: IPoint = { x: -1, y: -1 };
  private isShiftPressingWhenStart = false;
  private startSelectedControls: ISelectedIdxInfo[] = [];

  constructor(private editor: Editor) {}
  onActive() {
    // noop
  }
  onInactive() {
    // noop
  }
  onStart() {
    this.isShiftPressingWhenStart = false;
    const editor = this.editor;
    const pathEditor = editor.pathEditor;
    if (editor.hostEventManager.isShiftPressing) {
      this.isShiftPressingWhenStart = true;
      this.startSelectedControls =
        editor.pathEditor.selectedControl.getSelectedControls();
    } else {
      this.startSelectedControls =
        pathEditor.selectedControl.getSelectedControls();
      // 保持上一次绘制的控制点继续渲染（这样才能让用户选中 in 和 out）
      pathEditor.selectedControl.setNormalControls(
        pathEditor.selectedControl.getSelectedControls(),
      );
      pathEditor.drawControlHandles();
    }

    this.lastPoint = editor.toolManager.getCurrPoint();

    editor.render();
    editor.sceneGraph.setSelection(this.lastPoint);
  }
  onDrag(e: PointerEvent) {
    const point = this.editor.getSceneCursorXY(e);

    const box = getRectByTwoPoint(this.lastPoint, point);
    this.editor.sceneGraph.setSelection(box);

    const controls =
      this.editor.controlHandleManager.getCustomHandlesIntersectedWithRect(box);

    const info: ISelectedIdxInfo[] = controls
      .filter(
        (control) =>
          control.type.startsWith('anchor-') ||
          control.type.startsWith('in-') ||
          control.type.startsWith('out-'),
      )
      .map((control) => {
        const strs = control.type.split('-');
        return {
          type: strs[0] as SelectedIdexType,
          pathIdx: parseInt(strs[1]),
          segIdx: parseInt(strs[2]),
        };
      });

    if (this.isShiftPressingWhenStart) {
      this.editor.pathEditor.selectedControl.setItems([
        ...this.startSelectedControls,
        ...info,
      ]);
      this.editor.pathEditor.drawControlHandles();
    } else {
      this.editor.pathEditor.selectedControl.setItems(info);
      this.editor.pathEditor.drawControlHandles();
    }

    this.editor.render();
  }
  onEnd() {
    // noop
  }
  afterEnd(_event: PointerEvent, isDragHappened: boolean) {
    this.isShiftPressingWhenStart = false;
    this.startSelectedControls = [];

    this.editor.pathEditor.selectedControl.setNormalControls([]);
    if (!isDragHappened) {
      this.editor.pathEditor.selectedControl.clear();
    }
    this.editor.pathEditor.drawControlHandles();

    this.editor.sceneGraph.selection = null;
    this.editor.render();
  }
}
