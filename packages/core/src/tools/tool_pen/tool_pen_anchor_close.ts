import { cloneDeep } from '@suika/common';
import {
  type IMatrixArr,
  type IPathItem,
  type IPoint,
  type ISegment,
} from '@suika/geo';

import { SetGraphsAttrsCmd } from '../../commands';
import { type SuikaEditor } from '../../editor';
import { type IBaseTool } from '../type';
import { type PenTool } from './tool_pen';

export class ToolDrawPathClose implements IBaseTool {
  private startPoint: IPoint | null = null;
  private prevAttrs: {
    transform: IMatrixArr;
    pathData: IPathItem[];
  } | null = null;

  constructor(private editor: SuikaEditor, private parentTool: PenTool) {}

  onActive() {
    /* noop */
  }
  onInactive() {
    /* noop */
  }

  onStart() {
    this.startPoint = this.parentTool.getCorrectedPoint();
    this.prevAttrs = cloneDeep({
      transform: this.parentTool.path!.attrs.transform,
      pathData: this.parentTool.path!.attrs.pathData,
    });

    const path = this.parentTool.path!;
    path.setPathItemClosed(this.parentTool.pathIdx, true);
    path.setSeg(this.parentTool.pathIdx, 0, {
      in: { x: 0, y: 0 },
    });
  }

  onDrag() {
    const point = this.parentTool.getCorrectedPoint();
    const path = this.parentTool.path!;

    const startPoint = this.startPoint!;

    const dx = point.x - startPoint.x;
    const dy = point.y - startPoint.y;

    const lastSegIdx = path.getSegCount(this.parentTool.pathIdx) - 1;
    // mirror angle and length
    const inAndOut: Partial<ISegment> = {
      out: { x: dx, y: dy },
    };
    // (1) When alt is pressed, the symmetry is not required
    // (2) When the first point is drawn, "in" remains 0
    if (!this.editor.hostEventManager.isAltPressing && lastSegIdx !== 0) {
      inAndOut.in = { x: -dx, y: -dy };
    }
    path.setSeg(this.parentTool.pathIdx, 0, inAndOut);

    this.editor.pathEditor.drawControlHandles();
    this.editor.render();
  }

  onEnd() {
    this.editor.pathEditor.selectedControl.clear();
    const path = this.parentTool.path!;

    path.updateAttrs({ pathData: path.attrs.pathData });
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Path Data',
        [path],
        [
          cloneDeep({
            transform: path.attrs.transform,
            pathData: path.attrs.pathData,
          }),
        ],
        [this.prevAttrs!],
      ),
    );
    this.editor.commandManager.batchCommandEnd();
  }

  afterEnd() {
    /* noop */
  }
}
