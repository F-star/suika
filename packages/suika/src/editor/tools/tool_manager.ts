import { noop } from '../../utils/common';
import EventEmitter from '../../utils/event_emitter';
import { Editor } from '../editor';
import { DragCanvasTool } from './drag_canvas';
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
    this.toolMap.set(SelectTool.type, new SelectTool(editor));
    this.toolMap.set(DragCanvasTool.type, new DragCanvasTool(editor));

    this.setTool(DrawRectTool.type);

    this._unbindEvent = this.bindEvent();
  }
  getToolName() {
    return this.currentTool?.type;
  }
  bindEvent() {
    let isDowning = false;

    const handleDown = (e: PointerEvent) => {
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }
      isDowning = true;
      this.currentTool.start(e);
    };
    const handleMove = (e: PointerEvent) => {
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }
      if (isDowning) {
        this.currentTool.drag(e);
      }
    };
    const handleUp = (e: PointerEvent) => {
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }
      if (isDowning) {
        isDowning = false;
        this.currentTool.end(e);
      }
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
    const currentTool = this.currentTool = this.toolMap.get(toolName) || null;
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