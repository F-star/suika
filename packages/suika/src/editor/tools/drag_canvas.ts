import { IBox, IPoint } from '../../type.interface';
import { Editor } from '../editor';
import { ITool } from './type';

/**
 * 拖拽画布
 */
export class DragCanvasTool implements ITool {
  static type = 'dragCanvas';
  type = 'dragCanvas';
  startPointer: IPoint = { x: -1, y: -1 };
  prevViewport!: IBox;

  constructor(private editor: Editor) {}
  active() {
    this.editor.canvasElement.style.cursor = 'grab';
  }
  inactive() {
    this.editor.canvasElement.style.cursor = '';
  }
  moveExcludeDrag() {
    // do nothing;
  }
  start(e: PointerEvent) {
    this.editor.canvasElement.style.cursor = 'grabbing';
    this.startPointer = this.editor.getCursorXY(e);
    this.prevViewport = this.editor.viewportManager.getViewport();
  }
  drag(e: PointerEvent) {
    const pointer: IPoint = this.editor.getCursorXY(e);
    const startPointer = this.startPointer;
    const dx = pointer.x - startPointer.x;
    const dy = pointer.y - startPointer.y;
    const zoom = this.editor.zoomManager.getZoom();
    // 类似苹果笔记本触控板的 “自然滚动”，所以他要反向，即加上 "-dx"
    const viewportX = this.prevViewport.x - dx / zoom;
    const viewportY = this.prevViewport.y - dy / zoom;

    this.editor.viewportManager.setViewport({ x: viewportX, y: viewportY });
    this.editor.sceneGraph.render();
  }
  end() {
    // do nothing
  }
  afterEnd() {
    this.editor.canvasElement.style.cursor = 'grab';
  }
}
