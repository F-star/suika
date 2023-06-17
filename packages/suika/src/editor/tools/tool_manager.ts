import hotkeys from 'hotkeys-js';
import { noop } from '../../utils/common';
import EventEmitter from '../../utils/event_emitter';
import { Editor } from '../editor';
import { DragCanvasTool } from './drag_canvas';
import { DrawEllipseTool } from './tool_draw_ellipse';
import { DrawRectTool } from './tool_draw_rect';
import { SelectTool } from './tool_select';
import { ITool } from './type';

interface Events {
  change(type: string): void;
}

export class ToolManager {
  toolMap = new Map<string, ITool>();
  hotkeyMap = new Map<string, string>();

  currentTool: ITool | null = null;
  eventEmitter = new EventEmitter<Events>();

  enableSwitchTool = true;

  _unbindEvent: () => void;
  constructor(private editor: Editor) {
    this.registerToolAndHotKey(new SelectTool(editor));
    this.registerToolAndHotKey(new DrawRectTool(editor));
    this.registerToolAndHotKey(new DrawEllipseTool(editor));
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
    let isEnableDrag = false;
    let startWithLeftMouse = false;

    const handleDown = (e: PointerEvent) => {
      isPressing = true;
      isEnableDrag = false;
      startWithLeftMouse = false;
      if (e.button !== 0) {
        // must to be left mouse button
        return;
      }
      startWithLeftMouse = true;
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
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
          !isEnableDrag &&
          (Math.abs(dx) > dragBlockStep || Math.abs(dy) > dragBlockStep)
        ) {
          isEnableDrag = true;
        }
        if (isEnableDrag) {
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
        this.currentTool.end(e, isEnableDrag);
        this.currentTool.afterEnd();
      }

      isEnableDrag = false;
    };
    const canvas = this.editor.canvasElement;
    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    // (2) tool hotkey
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        this.hotkeyMap.has(key)
      ) {
        const type = this.hotkeyMap.get(key)!;
        this.setActiveTool(type);
      }
    };
    hotkeys('*', { keydown: true }, handler);

    return function unbindEvent() {
      canvas.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      hotkeys.unbind('*', handler);
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
