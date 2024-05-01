import { EventEmitter } from '@suika/common';

import { RemoveGraphsCmd } from '../commands';
import { type ControlHandle } from '../control_handle_manager';
import { type Editor } from '../editor';
import { type Graph, type Path } from '../graphs';
import { DrawPathTool, PathSelectTool } from '../tools';
import { SelectTool } from '../tools/tool_select';
import { SelectedControl } from './selected_control';
import { type ISelectedIdxInfo, type SelectedIdexType } from './type';

interface Events {
  toggle: (active: boolean) => void;
}

export class PathEditor {
  private _active = false;
  private path: Path | null = null;
  private eventTokens: number[] = [];
  private prevToolKeys: string[] = [];
  private eventEmitter = new EventEmitter<Events>();

  selectedControl: SelectedControl;

  constructor(private editor: Editor) {
    this.selectedControl = new SelectedControl(editor);
  }

  private onSelectedChange = (items: Graph[]) => {
    if (items.length === 0 || items[0] === this.path) {
      return;
    }
    // end path edit
    this.inactive();
    this.editor.toolManager.setActiveTool('select');
  };
  getPath() {
    return this.path;
  }
  isActive() {
    return this._active;
  }
  active(path: Path) {
    this._active = true;
    this.path = path;

    const editor = this.editor;
    editor.sceneGraph.showSelectedGraphsOutline = false;
    editor.sceneGraph.highlightLayersOnHover = false;
    editor.controlHandleManager.enableTransformControl = false;

    this.unbindHotkeys();
    this.bindHotkeys();

    this.prevToolKeys = editor.toolManager.getEnableTools();
    editor.toolManager.setEnableHotKeyTools([
      PathSelectTool.type,
      DrawPathTool.type,
    ]);
    const currTool = editor.toolManager.getActiveToolName();
    if (currTool !== PathSelectTool.type && currTool !== DrawPathTool.type) {
      editor.toolManager.setActiveTool(PathSelectTool.type);
    }

    editor.selectedElements.on('itemsChange', this.onSelectedChange);
    editor.pathEditor.drawControlHandles();
    this.eventEmitter.emit('toggle', true);
  }
  inactive(source?: 'undo') {
    if (!this._active) {
      return;
    }

    this._active = false;
    if (source !== 'undo') {
      this.removePathIfEmpty();
    }

    this.selectedControl.clear();
    this.path = null;
    const editor = this.editor;
    editor.sceneGraph.showSelectedGraphsOutline = true;
    editor.sceneGraph.highlightLayersOnHover = true;
    editor.controlHandleManager.enableTransformControl = true;

    this.unbindHotkeys();
    editor.toolManager.setEnableHotKeyTools(this.prevToolKeys);
    editor.toolManager.setActiveTool(SelectTool.type);
    editor.selectedElements.off('itemsChange', this.onSelectedChange);

    editor.controlHandleManager.clearCustomHandles();
    editor.render();

    // TODO: FIXME: 加一个结束路径编辑的空命令，但加一个 beforeUndo...

    this.eventEmitter.emit('toggle', false);
  }
  private removePathIfEmpty() {
    const path = this.path;
    if (!path) return;
    const pathData = path.attrs.pathData;
    if (
      pathData.length === 0 ||
      pathData.every((item) => item.segs.length <= 1)
    ) {
      this.editor.commandManager.pushCommand(
        new RemoveGraphsCmd('remove empty path', this.editor, [path]),
      );
    }
  }
  private bindHotkeys() {
    const editor = this.editor;

    this.eventTokens = [];
    // delete / backspace: delete selected segments
    let token = editor.keybindingManager.registerWithHighPrior({
      key: [{ keyCode: 'Backspace' }, { keyCode: 'Delete' }],
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Path Delete',
      action: () => {
        // TODO: 删除选中的控制点
      },
    });
    this.eventTokens.push(token);

    // esc: finish current path edit
    token = editor.keybindingManager.registerWithHighPrior({
      key: { keyCode: 'Escape' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Path Finish',
      action: () => {
        if (this.selectedControl.getSelectedControlsSize() > 0) {
          this.selectedControl.clear();
          this.drawControlHandles();
          this.editor.render();
        } else {
          this.inactive();
        }
      },
    });
    this.eventTokens.push(token);

    // enter: end path
    token = editor.keybindingManager.registerWithHighPrior({
      key: { keyCode: 'Enter' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Path End',
      action: () => {
        this.inactive();
      },
    });
    this.eventTokens.push(token);
  }

  private unbindHotkeys() {
    for (const token of this.eventTokens) {
      this.editor.keybindingManager.unregister(token);
    }
    this.eventTokens = [];
  }

  /**
   * parse selected index from string
   * e.g. 'anchor-0-1' -> { type: 'anchor', pathIdx: 0, segIdx: 1 }
   */
  static parseSelectedInfoStr(
    selectedInfoStr: string,
  ): ISelectedIdxInfo | null {
    const selectedInfo = selectedInfoStr.split('-');
    if (selectedInfo.length !== 3) return null;
    return {
      type: selectedInfo[0] as SelectedIdexType,
      pathIdx: parseInt(selectedInfo[1]),
      segIdx: parseInt(selectedInfo[2]),
    };
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }
  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }

  drawControlHandles(addedControlHandles: ControlHandle[] = []) {
    this.selectedControl.drawControlHandles(addedControlHandles);
  }
}
