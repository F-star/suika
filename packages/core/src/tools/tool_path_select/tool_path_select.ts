import { type ICursor } from '../../cursor_manager';
import { type Editor } from '../../editor';
import { type IBaseTool, type ITool } from '../type';
import { PathSelectMoveTool } from './tool_path_select_move';
import { DrawPathSelectionTool } from './tool_path_select_selection';

const TYPE = 'pathSelect';
const HOTKEY = 'v';

export class PathSelectTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'default';

  private currStrategy: IBaseTool | null = null;
  private readonly strategyMove: PathSelectMoveTool;
  private readonly strategyDrawSelection: DrawPathSelectionTool;

  constructor(private editor: Editor) {
    this.strategyMove = new PathSelectMoveTool(editor);
    this.strategyDrawSelection = new DrawPathSelectionTool(editor);
  }
  onActive() {
    // noop
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
      this.currStrategy = this.strategyMove;
    } else {
      this.currStrategy = this.strategyDrawSelection;
    }

    if (this.currStrategy) {
      this.currStrategy.onActive();
      this.currStrategy.onStart(e);
    } else {
      throw new Error('no strategy found');
    }
  }
  onDrag(e: PointerEvent) {
    if (this.currStrategy) {
      this.currStrategy.onDrag(e);
    } else {
      throw new Error('no strategy found');
    }
  }
  onEnd(e: PointerEvent, isDragHappened: boolean) {
    this.editor.controlHandleManager.showCustomHandles();

    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }

    const currStrategy = this.currStrategy;
    if (currStrategy) {
      currStrategy.onEnd(e, isDragHappened);
      currStrategy.onInactive();
    } else {
      throw new Error('no strategy found');
    }
  }

  onMoveExcludeDrag() {
    // noop
  }

  afterEnd(e: PointerEvent) {
    if (!this.editor.hostEventManager.isDraggingCanvasBySpace) {
      this.editor.setCursor('default');
    }

    this.currStrategy?.afterEnd(e);
    this.currStrategy = null;
  }

  onCommandChange() {
    this.editor.pathEditor.updateControlHandles();
  }
  onViewportXOrYChange() {
    if (this.editor.hostEventManager.isSpacePressing) {
      this.editor.pathEditor.updateControlHandles();
    } else {
      this.editor.pathEditor.updateControlHandles();
    }
    this.editor.render();
  }
}
