import { IPoint } from '../../../type';
import { arrMap } from '../../../utils/array_util';
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
  /**
   * 参照点
   */
  private referencePoint: IPoint = { x: -1, y: -1 };

  constructor(private editor: Editor) {}

  active() {
    //
  }
  inactive() {
    //
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
    switch (handleName) {
      case 'se':
        this.referencePoint = this.editor.sceneGraph.transformHandle.handle!.nw; // maybe unnecessary
        break;
      // TODO: other handle
    }
  }
  drag(e: PointerEvent) {
    this.editor.commandManager.disableRedoUndo();
    this.editor.hostEventManager.disableDelete();

    const lastPoint = this.editor.getSceneCursorXY(e);
    const selectItems = this.editor.selectedElements.getItems();
    // 右下角
    if (this.handleName === 'se') {
      // 转换回来
      if (selectItems.length === 1) {
        selectItems[0].setSE(lastPoint, this.prevElements[0]);
      }
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
  }
}
