import { EventEmitter, noop } from '@suika/common';
import { IPoint } from '@suika/geo';

import { Editor } from '../editor';
import { DragCanvasTool } from './tool_drag_canvas';
import { DrawEllipseTool } from './tool_draw_ellipse';
import { DrawLineTool } from './tool_draw_line';
import { DrawPathTool } from './tool_draw_path';
import { DrawRectTool } from './tool_draw_rect';
import { DrawTextTool } from './tool_draw_text';
import { SelectTool } from './tool_select';
import { ITool, IToolClassConstructor } from './type';

interface Events {
  change(type: string): void;
}

/**
 * Tool Manager
 * reference: https://mp.weixin.qq.com/s/ZkZZoscN6N7_ykhC9rOpdQ
 */
export class ToolManager {
  /** tool type(string) => tool class constructor */
  private toolCtorMap = new Map<string, IToolClassConstructor>();
  /** hotkey => tool type */
  private hotkeyMap = new Map<string, string>();
  private currentTool: ITool | null = null;
  private eventEmitter = new EventEmitter<Events>();
  private enableSwitchTool = true;
  private keyBindingToken: number[] = [];
  private _isDragging = false;
  _unbindEvent: () => void;

  isDragging() {
    return this._isDragging;
  }

  constructor(private editor: Editor) {
    this.registerToolCtorAndHotKey(SelectTool);
    this.registerToolCtorAndHotKey(DrawRectTool);
    this.registerToolCtorAndHotKey(DrawEllipseTool);
    this.registerToolCtorAndHotKey(DrawPathTool);
    this.registerToolCtorAndHotKey(DrawLineTool);
    this.registerToolCtorAndHotKey(DrawTextTool);
    this.registerToolCtorAndHotKey(DragCanvasTool);

    this.setActiveTool(SelectTool.type);

    this._unbindEvent = this.bindEvent();

    this.setEnableHotKeyTools([
      SelectTool.type,
      DrawRectTool.type,
      DrawEllipseTool.type,
      DrawPathTool.type,
      DrawLineTool.type,
      DrawTextTool.type,
      DragCanvasTool.type,
    ]);
  }
  private unbindHotkey() {
    this.keyBindingToken.forEach((token) => {
      this.editor.keybindingManager.unregister(token);
    });
  }
  private setEnableHotKeyTools(toolType: string[]) {
    this.unbindHotkey();
    for (const type of toolType) {
      const toolCtor = this.toolCtorMap.get(type);

      if (!toolCtor) {
        console.warn(
          `tool "${type}" not found, please register it before use it`,
        );
        continue;
      }

      const key = `Key${toolCtor.hotkey.toUpperCase()}`;
      const token = this.editor.keybindingManager.register({
        key: { keyCode: key },
        actionName: type,
        action: () => {
          this.setActiveTool(type);
        },
      });
      this.keyBindingToken.push(token);
    }
  }

  private registerToolCtorAndHotKey(toolCtor: IToolClassConstructor) {
    if (this.toolCtorMap.has(toolCtor.type)) {
      console.warn(`tool "${toolCtor.type}" had exit, replace it!`);
    }
    this.toolCtorMap.set(toolCtor.type, toolCtor);

    if (this.hotkeyMap.has(toolCtor.hotkey)) {
      console.warn(`hotkey "${toolCtor.type}" had exit, replace it!`);
    }
    this.hotkeyMap.set(toolCtor.hotkey, toolCtor.type);
  }
  getActiveToolName() {
    return this.currentTool?.type;
  }
  /**
   * bind event
   * about dragBlockStep: https://mp.weixin.qq.com/s/05lbcYIJ8qwP8EHCXzgnqA
   */
  private bindEvent() {
    // (1) drag block strategy
    let isPressing = false;
    let startPos: IPoint = { x: 0, y: 0 };
    let startWithLeftMouse = false;

    const handleDown = (e: PointerEvent) => {
      setTimeout(() => {
        isPressing = false;
        this._isDragging = false;
        startWithLeftMouse = false;
        if (
          e.button !== 0 || // is not left mouse
          this.editor.textEditor.isEditing() || // is editing text mode
          this.editor.hostEventManager.isSpacePressing // is dragging canvas mode
        ) {
          return;
        }

        isPressing = true;
        startWithLeftMouse = true;
        if (!this.currentTool) {
          throw new Error('there is no active tool');
        }
        startPos = { x: e.clientX, y: e.clientY };
        this.currentTool.start(e);
      });
    };
    const handleMove = (e: PointerEvent) => {
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }
      if (isPressing) {
        if (!startWithLeftMouse) {
          return;
        }
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        const dragBlockStep = this.editor.setting.get('dragBlockStep');
        if (
          !this._isDragging &&
          (Math.abs(dx) > dragBlockStep || Math.abs(dy) > dragBlockStep)
        ) {
          this._isDragging = true;
        }
        if (this._isDragging) {
          this.enableSwitchTool = false;
          this.editor.canvasDragger.disableDragBySpace();
          this.currentTool.drag(e);
        }
      } else {
        const isOutsideCanvas = this.editor.canvasElement !== e.target;
        this.currentTool.moveExcludeDrag(e, isOutsideCanvas);
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
        this.editor.canvasDragger.enableDragBySpace();
        isPressing = false;
        this.currentTool.end(e, this._isDragging);
        this.currentTool.afterEnd(e);
      }

      this._isDragging = false;
    };
    const handleCommandChange = () => {
      this.currentTool?.onCommandChange?.();
    };
    const handleSpaceToggle = (isSpacePressing: boolean) => {
      this.currentTool?.onSpaceToggle?.(isSpacePressing);
    };
    const handleViewportXOrYChange = (x: number, y: number) => {
      this.currentTool?.onViewportXOrYChange?.(x, y);
    };
    const canvas = this.editor.canvasElement;
    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    this.editor.commandManager.on('change', handleCommandChange);
    this.editor.hostEventManager.on('spaceToggle', handleSpaceToggle);
    this.editor.viewportManager.on('xOrYChange', handleViewportXOrYChange);

    return () => {
      canvas.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      this.editor.commandManager.off('change', handleCommandChange);
      this.editor.hostEventManager.off('spaceToggle', handleSpaceToggle);
    };
  }
  unbindEvent() {
    this._unbindEvent();
    this._unbindEvent = noop;
    this.unbindHotkey();
  }
  setActiveTool(toolName: string) {
    if (!this.enableSwitchTool || this.getActiveToolName() === toolName) {
      return;
    }

    const prevTool = this.currentTool;
    const currentToolCtor = this.toolCtorMap.get(toolName) || null;
    if (!currentToolCtor) {
      throw new Error(`没有 ${toolName} 对应的工具对象`);
    }
    const currentTool = (this.currentTool = new currentToolCtor(this.editor));

    prevTool && prevTool.inactive();
    this.setCursorWhenActive();
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
  setCursorWhenActive() {
    if (this.currentTool) {
      this.editor.cursorManager.setCursor(this.currentTool.cursor);
    }
  }
}
