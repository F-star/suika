import { cloneDeep, noop } from '@suika/common';

import { AddGraphCmd } from '../commands';
import { type ICursor } from '../cursor_manager';
import { type Editor } from '../editor';
import { Path } from '../graphs';
import { type ITool } from './type';

const TYPE = 'pencil';
const HOTKEY = '';

export class PencilTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'crosshair';
  commandDesc = 'draw by Pencil';
  private unbindEvent: () => void = noop;

  private path: Path | null = null;
  private isFirstDrag = true;

  constructor(private editor: Editor) {}
  onActive() {
    // do nothing
  }
  onInactive() {
    this.unbindEvent();
  }
  onMoveExcludeDrag() {
    // do nothing
  }

  onStart(e: PointerEvent) {
    this.path = new Path({
      objectName: '',
      width: 0,
      height: 0,
      pathData: [
        {
          segs: [],
          closed: false,
        },
      ],
      stroke: [cloneDeep(this.editor.setting.get('firstStroke'))],
      strokeWidth: 3,
    });

    const point = this.editor.getSceneCursorXY(e);
    this.path!.addSeg(0, {
      point,
      in: { x: 0, y: 0 },
      out: { x: 0, y: 0 },
    });
  }

  onDrag(e: PointerEvent) {
    const point = this.editor.getSceneCursorXY(e);
    this.path!.addSeg(0, {
      point,
      in: { x: 0, y: 0 },
      out: { x: 0, y: 0 },
    });

    if (this.isFirstDrag) {
      this.editor.sceneGraph.addItems([this.path!]);
      this.isFirstDrag = false;
    }
    this.editor.render();
  }

  onEnd(_e: PointerEvent, isDragHappened: boolean) {
    if (isDragHappened) {
      this.editor.commandManager.pushCommand(
        new AddGraphCmd('Add Path by pencil', this.editor, [this.path!]),
      );
    } else {
      this.editor.sceneGraph.removeItems([this.path!]);
    }
  }

  afterEnd() {
    this.path = null;
    this.isFirstDrag = true;
  }

  getDragBlockStep() {
    return 0;
  }
}
