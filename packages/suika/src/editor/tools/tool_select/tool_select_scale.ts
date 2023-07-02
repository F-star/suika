import { IPoint } from '../../../type';
import { arrMap } from '../../../utils/array_util';
import { remainDecimal } from '../../../utils/common';
import { transformRotate } from '../../../utils/transform';
import { SetElementsAttrs } from '../../commands/set_elements_attrs';
import { Editor } from '../../editor';
import { HandleName } from '../../scene/transform_handle';
import { IBaseTool } from '../type';

/**
 * scale element
 */
export class SelectScaleTool implements IBaseTool {
  private startPointer: IPoint = { x: -1, y: -1 };
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
    this.startPointer = this.editor.getSceneCursorXY(e);
    const handleName = this.editor.sceneGraph.transformHandle.getNameByPoint(
      this.startPointer,
    );

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
        this.referencePoint = this.editor.sceneGraph.transformHandle.handle!.nw;
        break;
      // TODO: other handle
    }
  }
  drag(e: PointerEvent) {
    this.editor.commandManager.disableRedoUndo();
    this.editor.hostEventManager.disableDelete();

    let lastPoint = this.editor.getSceneCursorXY(e);
    let referencePoint = this.referencePoint;
    const selectItems = this.editor.selectedElements.getItems();
    // 右下角
    if (this.handleName === 'se') {
      // 转换回来
      if (selectItems.length === 1 && selectItems[0].rotation) {
        const cx = (lastPoint.x + this.referencePoint.x) / 2;
        const cy = (lastPoint.y + this.referencePoint.y) / 2;
        lastPoint = transformRotate(
          lastPoint.x,
          lastPoint.y,
          -selectItems[0].rotation,
          cx,
          cy,
        );
        referencePoint = transformRotate(
          referencePoint.x,
          referencePoint.y,
          -selectItems[0].rotation,
          cx,
          cy,
        );
      }
    }

    let width = lastPoint.x - referencePoint.x;
    let height = lastPoint.y - referencePoint.y;

    // for (const item of selectItems) {
    //   item.width = width;
    //   item.height = height;
    // }

    if (width === 0 || height === 0) {
      return;
    }

    for (const item of selectItems) {
      if (width < 0) {
        width = 1;
      }
      if (height < 0) {
        height = 1;
      }
      item.resizeAndKeepRotatedXY({
        width: remainDecimal(width, 5),
        height: remainDecimal(height, 5),
      });
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
