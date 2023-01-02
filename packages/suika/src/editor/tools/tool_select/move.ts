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
  lastPointer: IPoint = { x: -1, y: -1 };
  startPoints: IPoint[] = [];
  dx = 0;
  dy = 0;

  constructor(private editor: Editor) {}
  start(e: PointerEvent) {
    this.lastPointer = {
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
    const dx = this.dx = x - this.lastPointer.x;
    const dy = this.dy = y - this.lastPointer.y;
    const selectedElements = this.editor.selectedElements.value;
    const startPoints = this.startPoints;
    for (let i = 0, len = selectedElements.length; i < len; i++) {
      selectedElements[i].x = startPoints[i].x + dx;
      selectedElements[i].y= startPoints[i].y + dy;
    }
    this.editor.sceneGraph.render();
  }
  end(e: PointerEvent) {
    this.editor.commandManger.pushCommand(
      new MoveElementsCommand(
        this.editor.selectedElements.value,
        this.dx,
        this.dy,
      )
    );
  }
}
