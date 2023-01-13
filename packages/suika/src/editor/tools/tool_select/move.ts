import { IPoint } from '../../../type.interface';
import { noop } from '../../../utils/common';
import { MoveElementsCommand } from '../../commands/move_elements';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';

/**
 * 选中工具的一个分支
 *
 * 移动元素
 */
export class SelectMoveTool implements IBaseTool {
  startPointer: IPoint = { x: -1, y: -1 };
  startPoints: IPoint[] = [];
  dragPointer!: IPoint;
  dx = 0;
  dy = 0;

  unbindEvents = noop;

  constructor(private editor: Editor) {}
  active() {
    const hotkeysManager = this.editor.hostEventManager;
    const moveWhenToggleShift = () => {
      if (this.dragPointer) {
        this.move();
      }
    };
    hotkeysManager.on('shiftToggle', moveWhenToggleShift);
    this.unbindEvents = () => {
      hotkeysManager.off('shiftToggle', moveWhenToggleShift);
    };
  }
  inactive() {
    this.unbindEvents();
  }
  start(e: PointerEvent) {
    this.startPointer = this.editor.viewportCoordsToScene(e.clientX, e.clientY);
    const selectedElements = this.editor.selectedElements.getItems();
    this.startPoints = selectedElements.map((element) => ({
      x: element.x,
      y: element.y,
    }));
  }
  drag(e: PointerEvent) {
    this.dragPointer = {
      x: e.clientX,
      y: e.clientY,
    };

    this.move();
  }
  private move() {
    const { x, y } = this.editor.viewportCoordsToScene(
      this.dragPointer.x,
      this.dragPointer.y
    );

    let dx = (this.dx = x - this.startPointer.x);
    let dy = (this.dy = y - this.startPointer.y);

    if (this.editor.hostEventManager.isShiftPressing) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }

    const selectedElements = this.editor.selectedElements.getItems();
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
        this.editor.selectedElements.getItems(),
        this.dx,
        this.dy
      )
    );
  }
}
