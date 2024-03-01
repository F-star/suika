import { cloneDeep } from '@suika/common';
import { IPoint } from '@suika/geo';

import { SetGraphsAttrsCmd } from '../../commands';
import { ICursor } from '../../cursor_manager';
import { Editor } from '../../editor';
import { ISegment } from '../../graphs';
import { ISelectedIdxInfo, SelectedIdexType } from '../../path_editor';
import { ITool } from '../type';

const TYPE = 'pathSelect';
const HOTKEY = 'v';

export class PathSelectTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'default';
  private startPoint: IPoint | null = null;
  private prevPathData: ISegment[][] = [];
  private indexInfo: Readonly<ISelectedIdxInfo> | null = null;

  constructor(private editor: Editor) {}
  onActive() {
    console.log('路径选择工具');
  }
  onInactive() {
    // noop
  }
  onStart(e: PointerEvent) {
    const startPoint = this.editor.getSceneCursorXY(e);

    const control =
      this.editor.controlHandleManager.getHandleInfoByPoint(startPoint);

    // hit anchor control
    if (control) {
      const selectedInfo = control.handleName.split('-');
      const type = selectedInfo[0] as SelectedIdexType;
      if (type === 'anchor') {
        this.startPoint = startPoint;
        this.prevPathData = cloneDeep(
          this.editor.pathEditor.getPath()!.pathData,
        );
        this.indexInfo = {
          type: selectedInfo[0] as SelectedIdexType,
          pathIdx: parseInt(selectedInfo[1]),
          segIdx: parseInt(selectedInfo[2]),
        };
        this.editor.pathEditor.setSelectedIndices([this.indexInfo]);
        this.editor.pathEditor.updateControlHandles();
        this.editor.render();
      }
    }
  }
  onDrag(e: PointerEvent) {
    const point = this.editor.getSceneCursorXY(e);
    if (this.startPoint) {
      const path = this.editor.pathEditor.getPath()!;
      const pathIdx = this.indexInfo!.pathIdx;
      const segIdx = this.indexInfo!.segIdx;
      const seg = path.getSeg(pathIdx, segIdx);
      if (seg) {
        path.setSeg(pathIdx, segIdx, { ...seg, point: point });
        this.editor.pathEditor.updateControlHandles();
        this.editor.render();
      }
    }
  }
  onEnd() {
    const path = this.editor.pathEditor.getPath()!;
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update path data',
        [path],
        [{ pathData: path!.pathData }],
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
    this.indexInfo = null;
  }

  onCommandChange() {
    this.editor.pathEditor.updateControlHandles();
  }
}
