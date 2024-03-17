import { cloneDeep } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { SetGraphsAttrsCmd } from '../../commands';
import { type ICursor } from '../../cursor_manager';
import { type Editor } from '../../editor';
import { type IPathItem } from '../../graphs';
import {
  type ISelectedIdxInfo,
  PathEditor,
  type SelectedIdexType,
} from '../../path_editor';
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
  private prevPathData: IPathItem[] = [];
  private indiesInfo: Readonly<ISelectedIdxInfo>[] = [];
  private anchorPoints: Readonly<IPoint>[] = [];

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

    const selectedInfo = control.handleName.split('-');
    const type = selectedInfo[0] as SelectedIdexType;

    if (type === 'anchor') {
      this.prevPathData = cloneDeep(pathEditor.getPath()!.attrs.pathData);

      const hitAnchor = PathEditor.parseSelectedIndex(control.handleName)!;

      // 判断是否已经选中
      if (
        pathEditor.containsSelectedIndex(
          hitAnchor.type,
          hitAnchor.pathIdx,
          hitAnchor.segIdx,
        )
      ) {
        this.indiesInfo = pathEditor.getSelectedIndices();
      } else {
        this.indiesInfo = [hitAnchor];
      }

      this.anchorPoints = this.indiesInfo.map(
        ({ pathIdx, segIdx }) =>
          pathEditor.getPath()!.getSeg(pathIdx, segIdx)!.point,
      );

      pathEditor.setSelectedIndices(this.indiesInfo);
      pathEditor.updateControlHandles();
      this.editor.render();
    }
  }
  onDrag(e: PointerEvent) {
    if (!this.startPoint) {
      return;
    }

    const point = this.editor.getSceneCursorXY(e);
    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const path = this.editor.pathEditor.getPath()!;
    for (let i = 0; i < this.indiesInfo.length; i++) {
      const { pathIdx, segIdx } = this.indiesInfo[i];
      const seg = path.getSeg(pathIdx, segIdx);
      if (seg) {
        path.setSeg(pathIdx, segIdx, {
          ...seg,
          point: {
            x: this.anchorPoints[i].x + dx,
            y: this.anchorPoints[i].y + dy,
          },
        });
        this.editor.pathEditor.updateControlHandles();
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
        [{ pathData: path!.attrs.pathData }],
        [{ pathData: this.prevPathData }],
      ),
    );
    this.editor.commandManager.batchCommandEnd();
  }

  onMoveExcludeDrag() {
    // noop
  }
  afterEnd() {
    this.startPoint = null;
    this.prevPathData = [];
    this.indiesInfo = [];
    this.anchorPoints = [];
  }

  onCommandChange() {
    this.editor.pathEditor.updateControlHandles();
  }
}
