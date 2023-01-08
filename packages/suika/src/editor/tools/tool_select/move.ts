import { IPoint } from '../../../type.interface';
import { MoveElementsCommand } from '../../commands/move_elements';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';

/**
 * 选中工具的
 *
 * 移动元素场景
 */
export class SelectMoveTool implements IBaseTool {
  startPointer: IPoint = { x: -1, y: -1 };
  startPoints: IPoint[] = [];
  dx = 0;
  dy = 0;

  constructor(private editor: Editor) {}
  active() {
    // do nothing
  }
  inactive() {
    // do nothing
  }
  start(e: PointerEvent) {
    this.startPointer = {
      x: e.clientX,
      y: e.clientY,
    };
    const selectedElements = this.editor.selectedElements.value;
    this.startPoints = selectedElements.map((element) => ({
      x: element.x,
      y: element.y,
    }));
  }
  drag(e: PointerEvent) {
    const x = e.clientX;
    const y = e.clientY;
    const zoom = this.editor.zoomManager.getZoom();
    const dx = (this.dx = (x - this.startPointer.x) / zoom);
    const dy = (this.dy = (y - this.startPointer.y) / zoom);
    const selectedElements = this.editor.selectedElements.value;
    const startPoints = this.startPoints;
    for (let i = 0, len = selectedElements.length; i < len; i++) {
      selectedElements[i].x = startPoints[i].x + dx;
      selectedElements[i].y = startPoints[i].y + dy;
    }
    this.editor.sceneGraph.render();
  }
  end() {
    this.editor.commandManger.pushCommand(
      new MoveElementsCommand(
        this.editor.selectedElements.value,
        this.dx,
        this.dy
      )
    );
  }
}
