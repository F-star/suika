import { IPoint } from '../../../type.interface';
import { noop } from '../../../utils/common';
import { MoveElementsCommand } from '../../commands/move_elements';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';

/**
 * select tool
 *
 * move selected elements
 */
export class SelectMoveTool implements IBaseTool {
  private startPointer: IPoint = { x: -1, y: -1 };
  private startPoints: IPoint[] = [];
  private dragPointer!: IPoint;
  private dx = 0;
  private dy = 0;
  private prevBBoxPos: IPoint = { x: -1, y: -1 };

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
    const viewportPos = this.editor.getCursorXY(e);
    this.startPointer = this.editor.viewportCoordsToScene(
      viewportPos.x,
      viewportPos.y,
    );
    const selectedElements = this.editor.selectedElements.getItems();
    this.startPoints = selectedElements.map((element) => ({
      x: element.x,
      y: element.y,
    }));
    const bBox = this.editor.selectedElements.getBBox();
    if (!bBox) {
      console.error(
        "selected elements should't be empty when moving, please report us issue",
      );
    } else {
      this.prevBBoxPos = { x: bBox.x, y: bBox.y };
    }
  }
  drag(e: PointerEvent) {
    this.dragPointer = this.editor.getCursorXY(e);
    this.move();
  }
  private move() {
    this.editor.sceneGraph.showOutline = false;
    const { x, y } = this.editor.viewportCoordsToScene(
      this.dragPointer.x,
      this.dragPointer.y,
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

    // in the moving phase, AABBox's x and y should round to be integer (snap to pixel grid)
    if (this.editor.setting.get('snapToPixelGrid')) {
      // if dx == 0, we thing it is in vertical moving.
      if (dx !== 0)
        dx = Math.round(this.prevBBoxPos.x + dx) - this.prevBBoxPos.x;
      // similarly dy
      if (dy !== 0)
        dy = Math.round(this.prevBBoxPos.y + dy) - this.prevBBoxPos.y;
    }

    const selectedElements = this.editor.selectedElements.getItems();
    const startPoints = this.startPoints;
    for (let i = 0, len = selectedElements.length; i < len; i++) {
      selectedElements[i].x = startPoints[i].x + dx;
      selectedElements[i].y = startPoints[i].y + dy;
    }
    this.editor.sceneGraph.render();
  }
  end(e: PointerEvent, isEnableDrag: boolean) {
    const selectedElements = this.editor.selectedElements.getItems();
    if (selectedElements.length === 0 || !isEnableDrag) {
      // 移动的时候元素被删除了，或者撤销导致为空
      // TODO: 属性复原
      return;
    }

    if (this.dx !== 0 || this.dy !== 0) {
      this.editor.commandManager.pushCommand(
        new MoveElementsCommand(
          'Move Elements',
          selectedElements,
          this.dx,
          this.dy,
        ),
      );
    }
  }
  afterEnd() {
    this.editor.sceneGraph.showOutline = true;
    this.editor.sceneGraph.render();
  }
}
