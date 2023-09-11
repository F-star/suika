import { IPoint } from '../../../type';
import { arrMap } from '../../../utils/array_util';
import { noop } from '../../../utils/common';
import { SetElementsAttrs } from '../../commands/set_elements_attrs';
import { Editor } from '../../editor';
import { HandleName } from '../../scene/transform_handle';
import { IBaseTool } from '../type';

/**
 * scale element
 */
export class SelectResizeTool implements IBaseTool {
  private startPoint: IPoint = { x: -1, y: -1 };
  private handleName!: Exclude<HandleName, 'rotation'>;
  private prevElements: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }> = [];
  private lastPoint: IPoint | null = null;
  private unbind = noop;

  constructor(private editor: Editor) {}

  active() {
    const handler = () => {
      this.resize();
    };
    this.editor.hostEventManager.on('shiftToggle', handler);
    this.editor.hostEventManager.on('altToggle', handler);

    this.unbind = () => {
      this.editor.hostEventManager.off('shiftToggle', handler);
      this.editor.hostEventManager.off('altToggle', handler);
    };
  }
  inactive() {
    this.unbind();
    this.unbind = noop;
  }
  start(e: PointerEvent) {
    this.startPoint = this.editor.getSceneCursorXY(e);
    const { handleName } =
      this.editor.sceneGraph.transformHandle.getNameByPoint(this.startPoint);

    this.prevElements = arrMap(
      this.editor.selectedElements.getItems(),
      (item) => ({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        rotation: item.rotation ?? 0,
      }),
    );
    if (!handleName || handleName === 'rotation') {
      throw new Error(`handleName ${handleName} is invalid`);
    }
    this.handleName = handleName;
  }
  drag(e: PointerEvent) {
    this.editor.commandManager.disableRedoUndo();
    this.editor.hostEventManager.disableDelete();

    this.lastPoint = this.editor.getSceneCursorXY(e);
    this.resize();
  }
  private resize() {
    if (!this.lastPoint) return;

    const selectItems = this.editor.selectedElements.getItems();
    if (selectItems.length === 1) {
      selectItems[0].movePoint(
        this.handleName,
        this.lastPoint,
        this.prevElements[0],
        this.editor.hostEventManager.isShiftPressing,
        this.editor.hostEventManager.isAltPressing,
      );
    } else {
      // TODO: multi elements case
    }

    this.editor.sceneGraph.render();
  }
  end(e: PointerEvent, isEnableDrag: boolean) {
    const items = this.editor.selectedElements.getItems();
    if (items.length === 0 || !isEnableDrag) {
      return;
    }
    this.editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'scale select elements',
        items,
        arrMap(items, (item) => ({
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          rotation: item.rotation,
        })),
        this.prevElements,
      ),
    );

    this.editor.commandManager.enableRedoUndo();
    this.editor.hostEventManager.enableDelete();
  }
  afterEnd() {
    this.prevElements = [];
    this.lastPoint = null;
  }
}
