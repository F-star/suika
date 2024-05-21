import { cloneDeep } from '@suika/common';
import {
  type IMatrixArr,
  type IPathItem,
  type IPoint,
  type ISegment,
} from '@suika/geo';

import { SetGraphsAttrsCmd } from '../../commands';
import { type ICursor } from '../../cursor_manager';
import { type Editor } from '../../editor';
import { type ISelectedIdxInfo, PathEditor } from '../../path_editor';
import { type ITool } from '../type';

const TYPE = 'pathSelect';
const HOTKEY = 'v';

export class PathSelectMoveTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'default';
  private startPoint: IPoint | null = null;
  private prevAttrs: { transform: IMatrixArr; pathData: IPathItem[] } | null =
    null;
  private selectedControls: Readonly<ISelectedIdxInfo>[] = [];
  private startSegs: Readonly<ISegment>[] = [];

  constructor(private editor: Editor) {}
  onActive() {
    // noop
  }
  onInactive() {
    // noop
  }
  onStart(e: PointerEvent) {
    const pathEditor = this.editor.pathEditor;
    const startPoint = (this.startPoint = this.editor.getSceneCursorXY(e));

    const control =
      this.editor.controlHandleManager.getHandleInfoByPoint(startPoint);
    if (!control) return;

    const path = pathEditor.getPath()!;
    this.prevAttrs = cloneDeep({
      transform: path.attrs.transform,
      pathData: path.attrs.pathData,
    });

    const hitAnchor = PathEditor.parseSelectedInfoStr(control.handleName)!;

    if (
      pathEditor.selectedControl.contains(
        hitAnchor.type,
        hitAnchor.pathIdx,
        hitAnchor.segIdx,
      )
    ) {
      this.selectedControls = pathEditor.selectedControl.getSelectedControls();
    } else {
      this.selectedControls = [hitAnchor];
    }

    this.startSegs = this.selectedControls.map(
      ({ pathIdx, segIdx }) =>
        pathEditor
          .getPath()!
          .getSeg(pathIdx, segIdx, { applyTransform: true })!,
    );

    pathEditor.selectedControl.setItems(this.selectedControls);
    pathEditor.drawControlHandles();
    this.editor.render();
  }
  onDrag(e: PointerEvent) {
    if (!this.startPoint) {
      return;
    }

    const point = this.editor.getSceneCursorXY(e);
    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const path = this.editor.pathEditor.getPath()!;
    for (let i = 0; i < this.selectedControls.length; i++) {
      const { type, pathIdx, segIdx } = this.selectedControls[i];
      const seg = path.getSeg(pathIdx, segIdx);
      if (seg) {
        const startSeg = this.startSegs[i];
        if (type === 'anchor') {
          path.setSeg(pathIdx, segIdx, {
            point: {
              x: startSeg.point.x + dx,
              y: startSeg.point.y + dy,
            },
          });
        } else if (
          // 如果某个 in/out 和它们对应的 anchor 也存在，忽略这个 in/out
          this.editor.pathEditor.selectedControl.contains(
            'anchor',
            pathIdx,
            segIdx,
          )
        ) {
          continue;
        } else if (type === 'in') {
          path.setSeg(pathIdx, segIdx, {
            in: {
              x: startSeg.in.x + dx,
              y: startSeg.in.y + dy,
            },
          });
        } else if (type === 'out') {
          path.setSeg(pathIdx, segIdx, {
            out: {
              x: startSeg.out.x + dx,
              y: startSeg.out.y + dy,
            },
          });
        }
        this.editor.pathEditor.drawControlHandles();
        this.editor.render();
      }
    }
  }
  onEnd() {
    const path = this.editor.pathEditor.getPath()!;
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'UpdatePathData',
        [path],
        [{ transform: path.attrs.transform, pathData: path.attrs.pathData }],
        [this.prevAttrs!],
      ),
    );
    this.editor.commandManager.batchCommandEnd();
  }

  onMoveExcludeDrag() {
    // noop
  }
  afterEnd() {
    this.startPoint = null;
    this.prevAttrs = null;
    this.selectedControls = [];
    this.startSegs = [];
  }

  onCommandChange() {
    this.editor.pathEditor.drawControlHandles();
  }
}
