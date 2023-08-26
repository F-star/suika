import { IBox, IPoint } from '../../type';
import { Editor } from '../editor';
import { ITool } from './type';

/**
 * drag canvas
 */
export class DragCanvasTool implements ITool {
  static type = 'dragCanvas';
  readonly type = 'dragCanvas';
  readonly hotkey = 'h';
  private startPoint: IPoint = { x: -1, y: -1 };
  private prevViewport!: IBox;

  constructor(private editor: Editor) {}
  active() {
    this.editor.setCursor('grab');
  }
  inactive() {
    this.editor.setCursor('default');
  }
  moveExcludeDrag() {
    // do nothing;
  }
  start(e: PointerEvent) {
    this.editor.canvasElement.style.cursor = 'grabbing';
    this.startPoint = this.editor.getCursorXY(e);
    this.prevViewport = this.editor.viewportManager.getViewport();
  }
  drag(e: PointerEvent) {
    const point: IPoint = this.editor.getCursorXY(e);
    const startPoint = this.startPoint;
    const dx = point.x - startPoint.x;
    const dy = point.y - startPoint.y;
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
