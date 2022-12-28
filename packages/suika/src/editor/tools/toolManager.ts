import { noop } from '../../utils/common';
import { Editor } from '../editor';
import { DrawRectTool } from './tool.drawRect';
import { ITool } from './type';

export class ToolManager {
  toolMap = new Map<string, ITool>();
  currentTool: ITool | null = null;
  _unbindEvent: () => void;
  constructor(private editor: Editor) {
    // 绑定 tool
    this.toolMap.set(DrawRectTool.type, new DrawRectTool(editor));

    this.setTool(DrawRectTool.type);

    this._unbindEvent = this.bindEvent();
  }
  bindEvent() {
    let isDowning = false;

    const currentTool = this.currentTool;
    const handleDown = (e: PointerEvent) => {
      if (!currentTool) {
        throw new Error('未设置当前使用工具');
      }
      isDowning = true;
      currentTool.start(e);
    };
    const handleMove = (e: PointerEvent) => {
      if (!currentTool) {
        throw new Error('未设置当前使用工具');
      }
      if (isDowning) {
        currentTool.drag(e);
      }
    };
    const handleUp = (e: PointerEvent) => {
      if (!currentTool) {
        throw new Error('未设置当前使用工具');
      }
      if (isDowning) {
        isDowning = false;
        currentTool.end(e);
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
  }
}