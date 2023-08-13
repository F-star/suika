import { noop } from '../../utils/common';
import EventEmitter from '../../utils/event_emitter';
import { Editor } from '../editor';
import { DragCanvasTool } from './tool_drag_canvas';
import { DrawEllipseTool } from './tool_draw_ellipse';
import { DrawRectTool } from './tool_draw_rect';
import { SelectTool } from './tool_select';
import { ITool } from './type';
import { DrawTextTool } from './tool_draw_text';
import { DrawLineTool } from './tool_draw_line';

interface Events {
  change(type: string): void;
}

export class ToolManager {
  toolMap = new Map<string, ITool>();
  /**
   * hotkey => tool type
   */
  hotkeyMap = new Map<string, string>();

  currentTool: ITool | null = null;
  eventEmitter = new EventEmitter<Events>();

  enableSwitchTool = true;

  isDragging = false;

  _unbindEvent: () => void;
  constructor(private editor: Editor) {
    this.registerToolAndHotKey(new SelectTool(editor));
    this.registerToolAndHotKey(new DrawRectTool(editor));
    this.registerToolAndHotKey(new DrawEllipseTool(editor));
    this.registerToolAndHotKey(new DrawLineTool(editor));
    this.registerToolAndHotKey(new DrawTextTool(editor));
    this.registerToolAndHotKey(new DragCanvasTool(editor));

    this.setActiveTool(SelectTool.type);

    this._unbindEvent = this.bindEvent();
  }
  registerToolAndHotKey(tool: ITool) {
    if (this.toolMap.has(tool.type)) {
      console.warn(`tool "${tool.type}" had exit, replace it!`);
    }
    this.toolMap.set(tool.type, tool);

    if (this.hotkeyMap.has(tool.hotkey)) {
      console.warn(`hotkey "${tool.type}" had exit, replace it!`);
    }
    this.hotkeyMap.set(tool.hotkey, tool.type);
  }
  getActiveToolName() {
    return this.currentTool?.type;
  }
  private bindEvent() {
    // (1) drag block strategy
    let isPressing = false;
    let startPos: [x: number, y: number] = [0, 0];
    let startWithLeftMouse = false;

    const handleDown = (e: PointerEvent) => {
      isPressing = true;
      this.isDragging = false;
      startWithLeftMouse = false;
      if (e.button !== 0) {
        // must be left mouse button
        return;
      }
      if (this.editor.textEditor.isEditing()) {
        return;
      }

      startWithLeftMouse = true;
      if (!this.currentTool) {
        throw new Error('there is no active tool');
      }
      startPos = [e.clientX, e.clientY];
      this.currentTool.start(e);
    };
    const handleMove = (e: PointerEvent) => {
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }
      if (isPressing) {
        if (!startWithLeftMouse) {
          return;
        }
        const dx = e.clientX - startPos[0];
        const dy = e.clientY - startPos[1];
        const dragBlockStep = this.editor.setting.get('dragBlockStep');
        if (
          !this.isDragging &&
          (Math.abs(dx) > dragBlockStep || Math.abs(dy) > dragBlockStep)
        ) {
          this.isDragging = true;
        }
        if (this.isDragging) {
          this.enableSwitchTool = false;
          this.editor.hostEventManager.disableDragBySpace();
          this.currentTool.drag(e);
        }
      } else {
        this.currentTool.moveExcludeDrag(e);
      }
    };
    const handleUp = (e: PointerEvent) => {
      this.enableSwitchTool = true;

      if (!startWithLeftMouse) {
        return;
      }
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }

      if (isPressing) {
        this.editor.hostEventManager.enableDragBySpace();
        isPressing = false;
        this.currentTool.end(e, this.isDragging);
        this.currentTool.afterEnd();
      }

      this.isDragging = false;
    };
    const canvas = this.editor.canvasElement;
    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    // (2) tool hotkey binding
    this.hotkeyMap.forEach((type, key) => {
      key = `Key${key.toUpperCase()}`;
      this.editor.keybindingManager.register({
        key: { keyCode: key },
        actionName: type,
        action: () => {
          this.setActiveTool(type);
        },
      });
    });

    return function unbindEvent() {
      canvas.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }
  unbindEvent() {
    this._unbindEvent();
    this._unbindEvent = noop;
  }
  setActiveTool(toolName: string) {
    if (!this.enableSwitchTool || this.getActiveToolName() === toolName) {
      return;
    }

    const prevTool = this.currentTool;
    const currentTool = (this.currentTool = this.toolMap.get(toolName) || null);
    if (!currentTool) {
      throw new Error(`没有 ${toolName} 对应的工具对象`);
    }
    prevTool && prevTool.inactive();
    currentTool.active();
    this.eventEmitter.emit('change', currentTool.type);
  }
  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }
  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
  destroy() {
    this.currentTool?.inactive();
  }
}
