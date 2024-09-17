import { EventEmitter, noop } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { type IKey } from '../key_binding_manager';
import { DragCanvasTool } from './tool_drag_canvas';
import { DrawEllipseTool } from './tool_draw_ellipse';
import { DrawFrameTool } from './tool_draw_frame';
import { DrawLineTool } from './tool_draw_line';
import { DrawPathTool } from './tool_draw_path';
import { DrawRectTool } from './tool_draw_rect';
import { DrawRegularPolygonTool } from './tool_draw_regular_polygon';
import { DrawStarTool } from './tool_draw_star';
import { DrawTextTool } from './tool_draw_text';
import { PathSelectTool } from './tool_path_select/tool_path_select';
import { PencilTool } from './tool_pencil';
import { SelectTool } from './tool_select';
import { type ITool, type IToolClassConstructor } from './type';

interface Events {
  switchTool(type: string): void;
  changeEnableTools(toolTypes: string[]): void;
}

/**
 * Tool Manager
 * reference: https://mp.weixin.qq.com/s/ZkZZoscN6N7_ykhC9rOpdQ
 */
export class ToolManager {
  /** tool type(string) => tool class constructor */
  private toolCtorMap = new Map<string, IToolClassConstructor>();
  /** hotkey => tool type */
  private hotkeySet = new Set<string>();
  private currentTool: ITool | null = null;
  private eventEmitter = new EventEmitter<Events>();
  private enableSwitchTool = true;
  private keyBindingToken: number[] = [];
  private _isDragging = false;
  private enableToolTypes: string[] = [];
  private currViewportPoint: IPoint = { x: Infinity, y: Infinity };

  _unbindEvent: () => void;

  constructor(private editor: SuikaEditor) {
    this.registerToolCtor(SelectTool);
    this.registerToolCtor(DrawFrameTool);
    this.registerToolCtor(DrawRectTool);
    this.registerToolCtor(DrawEllipseTool);
    this.registerToolCtor(DrawLineTool);
    this.registerToolCtor(DrawTextTool);
    this.registerToolCtor(DragCanvasTool);
    this.registerToolCtor(PathSelectTool);
    this.registerToolCtor(DrawPathTool);
    this.registerToolCtor(DrawRegularPolygonTool);
    this.registerToolCtor(DrawStarTool);
    this.registerToolCtor(PencilTool);

    this.setEnableHotKeyTools([
      SelectTool.type,
      DrawFrameTool.type,
      DrawRectTool.type,
      DrawEllipseTool.type,
      DrawPathTool.type,
      PencilTool.type,
      DrawLineTool.type,
      DrawRegularPolygonTool.type,
      DrawStarTool.type,
      DrawTextTool.type,
      DragCanvasTool.type,
    ]);

    this.setActiveTool(SelectTool.type);
    this._unbindEvent = this.bindEvent();
  }
  private unbindHotkey() {
    this.keyBindingToken.forEach((token) => {
      this.editor.keybindingManager.unregister(token);
    });
    this.keyBindingToken = [];
  }

  public setEnableHotKeyTools(toolTypes: string[]) {
    this.enableToolTypes = toolTypes;
    this.eventEmitter.emit('changeEnableTools', [...toolTypes]);
  }
  public getEnableTools() {
    return [...this.enableToolTypes];
  }

  private registerToolCtor(toolCtor: IToolClassConstructor) {
    const type = toolCtor.type;
    if (this.toolCtorMap.has(type)) {
      console.warn(`tool "${type}" had exit, replace it!`);
    }

    this.toolCtorMap.set(type, toolCtor);

    // select and pathSelect tool has same hotkey
    const hotkey = toolCtor.hotkey;
    let keyCode = '';
    let hotkeyObj: IKey;

    if (!hotkey) {
      console.log(`${type} has no hotkey`);
      return;
    }

    if (typeof hotkey === 'string') {
      keyCode = `Key${hotkey.toUpperCase()}`;
      hotkeyObj = { keyCode: keyCode };
    } else {
      // support complex hotkey
      keyCode = `${hotkey.altKey ? 'alt+' : ''}${
        hotkey.ctrlKey ? 'ctrl+' : ''
      }${hotkey.shiftKey ? 'shift+' : ''}${hotkey.metaKey ? 'meta+' : ''}${
        hotkey.keyCode
      }`;
      hotkeyObj = hotkey;
    }

    if (this.hotkeySet.has(keyCode)) {
      console.log(`register same hotkey: "${keyCode}"`);
    }
    this.hotkeySet.add(keyCode);
    const token = this.editor.keybindingManager.register({
      key: hotkeyObj,
      actionName: type,
      when: () => this.enableToolTypes.includes(type),
      action: () => {
        this.setActiveTool(type);
      },
    });
    this.keyBindingToken.push(token);
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
          this.editor.textEditor.isActive() || // is editing text mode
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
        this.currentTool.onStart(e);
      });
    };
    const handleMove = (e: PointerEvent) => {
      this.currViewportPoint = this.editor.getCursorXY(e);
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }
      if (isPressing) {
        if (!startWithLeftMouse) {
          return;
        }
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        const dragBlockStep =
          this.currentTool.getDragBlockStep?.() ??
          this.editor.setting.get('dragBlockStep');
        if (
          !this._isDragging &&
          (Math.abs(dx) > dragBlockStep || Math.abs(dy) > dragBlockStep)
        ) {
          this._isDragging = true;
        }
        if (this._isDragging) {
          this.enableSwitchTool = false;
          this.editor.canvasDragger.disableDragBySpace();
          this.currentTool.onDrag(e);
        }
      } else {
        const isOutsideCanvas = this.editor.canvasElement !== e.target;
        this.currentTool.onMoveExcludeDrag(e, isOutsideCanvas);
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
        this.currentTool.onEnd(e, this._isDragging);
        this.currentTool.afterEnd(e, this._isDragging);
      }

      this._isDragging = false;
    };
    const handleCommandChange = () => {
      this.currentTool?.onCommandChange?.();
    };
    const handleSpaceToggle = (isSpacePressing: boolean) => {
      this.currentTool?.onSpaceToggle?.(isSpacePressing);
    };
    const handleShiftToggle = (isShiftPressing: boolean) => {
      this.currentTool?.onShiftToggle?.(isShiftPressing);
    };
    const handleAltToggle = (isAltPressing: boolean) => {
      this.currentTool?.onAltToggle?.(isAltPressing);
    };
    const handleViewportXOrYChange = (x: number, y: number) => {
      this.currentTool?.onViewportXOrYChange?.(x, y);
    };
    const handleCanvasDragActiveChange = (active: boolean) => {
      this.currentTool?.onCanvasDragActiveChange?.(active);
    };
    const canvas = this.editor.canvasElement;
    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    this.editor.commandManager.on('change', handleCommandChange);
    this.editor.hostEventManager.on('spaceToggle', handleSpaceToggle);
    this.editor.hostEventManager.on('shiftToggle', handleShiftToggle);
    this.editor.hostEventManager.on('altToggle', handleAltToggle);
    this.editor.viewportManager.on('xOrYChange', handleViewportXOrYChange);
    this.editor.canvasDragger.on('activeChange', handleCanvasDragActiveChange);

    return () => {
      canvas.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      this.editor.commandManager.off('change', handleCommandChange);
      this.editor.hostEventManager.off('spaceToggle', handleSpaceToggle);
      this.editor.hostEventManager.off('shiftToggle', handleShiftToggle);
      this.editor.hostEventManager.off('altToggle', handleAltToggle);
      this.editor.viewportManager.off('xOrYChange', handleViewportXOrYChange);
      this.editor.canvasDragger.off(
        'activeChange',
        handleCanvasDragActiveChange,
      );
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

    if (!this.enableToolTypes.includes(toolName)) {
      console.warn(`target tool "${toolName}" is not enable`);
      return;
    }

    const prevTool = this.currentTool;
    const currentToolCtor = this.toolCtorMap.get(toolName) || null;
    if (!currentToolCtor) {
      throw new Error(`tool "${toolName}" is not registered`);
    }
    const currentTool = (this.currentTool = new currentToolCtor(this.editor));

    prevTool && prevTool.onInactive();
    this.setCursorWhenActive();
    currentTool.onActive();
    this.eventEmitter.emit('switchTool', currentTool.type);
  }
  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }
  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
  destroy() {
    this.currentTool?.onInactive();
  }
  setCursorWhenActive() {
    if (this.currentTool) {
      this.editor.cursorManager.setCursor(this.currentTool.cursor);
    }
  }

  isDragging() {
    return this._isDragging;
  }

  getCurrPoint() {
    return this.editor.toScenePt(
      this.currViewportPoint.x,
      this.currViewportPoint.y,
    );
  }
}
