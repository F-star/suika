import { cloneDeep } from '@suika/common';

import { SetGraphsAttrsCmd } from '../../commands/set_elements_attrs';
import { type SuikaEditor } from '../../editor';
import { type IBaseTool } from '../type';
import { type PenTool } from './tool_pen';

export class ToolDrawPathAnchorRemove implements IBaseTool {
  constructor(private editor: SuikaEditor, private parentTool: PenTool) {}

  onActive() {
    /* noop */
  }

  onInactive() {
    /* noop */
  }

  onStart() {
    const editor = this.editor;
    const pathEditor = editor.pathEditor;
    const path = this.parentTool.path!;

    const tol = editor.toSceneSize(
      this.editor.setting.get('selectionHitPadding'),
    );

    const closestAnchorInfo = path
      ? path.getClosestAnchor({
          point: editor.toolManager.getCurrPoint(),
          tol,
        })
      : null;

    if (!closestAnchorInfo) {
      return;
    }

    const prevAttrs = cloneDeep({
      transform: path.attrs.transform,
      pathData: path.attrs.pathData,
    });

    path.removeSeg(closestAnchorInfo.pathItemIndex, closestAnchorInfo.segIndex);

    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Path Data',
        [path],
        [
          cloneDeep({
            transform: path.attrs.transform,
            pathData: path.attrs.pathData,
          }),
        ],
        [prevAttrs!],
      ),
    );

    editor.pathEditor.selectedControl.clear();

    pathEditor.drawControlHandles();
    editor.render();
  }

  onDrag() {
    this.editor.setCursor('default');
  }

  onEnd() {
    this.editor.setCursor('pen');
  }

  afterEnd() {
    this.editor.setCursor('pen');
  }
}
