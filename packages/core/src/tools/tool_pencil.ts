import { cloneDeep, noop } from '@suika/common';
import { simplePath } from '@suika/geo';

import { AddGraphCmd } from '../commands';
import { type ICursor } from '../cursor_manager';
import { type SuikaEditor } from '../editor';
import { GraphicsObjectSuffix, SuikaPath } from '../graphics';
import { getNoConflictObjectName } from '../utils';
import { type ITool } from './type';

const TYPE = 'pencil';
const HOTKEY = { shiftKey: true, keyCode: 'KeyP' };

export class PencilTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'pencil';
  commandDesc = 'draw by Pencil';
  private unbindEvent: () => void = noop;

  private path: SuikaPath | null = null;
  private isFirstDrag = true;

  constructor(private editor: SuikaEditor) {}
  onActive() {
    this.editor.selectedElements.clear();
  }
  onInactive() {
    this.unbindEvent();
  }
  onMoveExcludeDrag() {
    // do nothing
  }

  onStart(e: PointerEvent) {
    this.path = new SuikaPath(
      {
        objectName: getNoConflictObjectName(
          this.editor.doc.getCurrentCanvas(),
          GraphicsObjectSuffix.Path,
        ),
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
      },
      {
        doc: this.editor.doc,
      },
    );

    const point = this.editor.getSceneCursorXY(e);
    this.path!.addSeg(0, {
      point,
      in: { x: 0, y: 0 },
      out: { x: 0, y: 0 },
    });
  }

  onDrag(e: PointerEvent) {
    const point = this.editor.getSceneCursorXY(e);
    const path = this.path!;
    path.addSeg(0, {
      point,
      in: { x: 0, y: 0 },
      out: { x: 0, y: 0 },
    });

    if (this.isFirstDrag) {
      this.editor.sceneGraph.addItems([path]);
      this.editor.doc.getCurrentCanvas().insertChild(path);
      this.isFirstDrag = false;
    }
    this.editor.render();
  }

  onEnd(_e: PointerEvent, isDragHappened: boolean) {
    const path = this.path!;
    if (isDragHappened) {
      const segs = path.attrs.pathData[0].segs;
      const newSegs = simplePath(
        segs,
        this.editor.setting.get('pencilCurveFitTolerance'),
      );
      path.attrs.pathData[0].segs = newSegs;
      this.editor.commandManager.pushCommand(
        new AddGraphCmd('Add Path by pencil', this.editor, [path]),
      );
    } else {
      path.setDeleted(true);
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
