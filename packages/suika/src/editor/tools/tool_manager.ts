import { noop } from '../../utils/common';
import EventEmitter from '../../utils/event_emitter';
import { Editor } from '../editor';
import { DragCanvasTool } from './drag_canvas';
import { DrawEllipseTool } from './tool_draw_ellipse';
import { DrawRectTool } from './tool_draw_rect';
import { SelectTool } from './tool_select';
import { ITool } from './type';

export class ToolManager {
  toolMap = new Map<string, ITool>();
  currentTool: ITool | null = null;
  eventEmitter: EventEmitter;
  _unbindEvent: () => void;
  constructor(private editor: Editor) {
    this.eventEmitter = new EventEmitter();
    // 绑定 tool
    this.toolMap.set(DrawRectTool.type, new DrawRectTool(editor));
    this.toolMap.set(DrawEllipseTool.type, new DrawEllipseTool(editor));
    this.toolMap.set(SelectTool.type, new SelectTool(editor));
    this.toolMap.set(DragCanvasTool.type, new DragCanvasTool(editor));

    this.setTool(DrawRectTool.type);

    this._unbindEvent = this.bindEvent();
  }
  getToolName() {
    return this.currentTool?.type;
  }
  bindEvent() {
    let isPressing = false;
    let startPos: [x: number, y: number] = [0, 0];
    let isEnableDrag = false;

    const handleDown = (e: PointerEvent) => {
      isPressing = true;
      isEnableDrag = false;
      if (e.button !== 0) {
        // must to be left mouse button
        return;
      }
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
          this.editor.hostEventManager.disableDragBySpace();
          this.currentTool.drag(e);
        }
      } else {
        this.currentTool.moveExcludeDrag(e);
      }
    };
    const handleUp = (e: PointerEvent) => {
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }
      if (e.button === 0) {
        // 必须是鼠标左键
        if (isPressing) {
          this.editor.hostEventManager.enableDragBySpace();
          isPressing = false;
          this.currentTool.end(e, isEnableDrag);
          this.currentTool.afterEnd();
        }
      }
      isEnableDrag = false;
    };
    const canvas = this.editor.canvasElement;
    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

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
  setTool(toolName: string) {
    const prevTool = this.currentTool;
    const currentTool = (this.currentTool = this.toolMap.get(toolName) || null);
    if (!currentTool) {
      throw new Error(`没有 ${toolName} 对应的工具对象`);
    }
    prevTool && prevTool.inactive();
    currentTool.active();
    this.eventEmitter.emit('change', currentTool.type);
  }
  on(eventName: 'change', handler: (toolName: string) => void) {
    this.eventEmitter.on(eventName, handler);
  }
  off(eventName: 'change', handler: (toolName: string) => void) {
    this.eventEmitter.off(eventName, handler);
  }
  destroy() {
    this.currentTool?.inactive();
  }
}
