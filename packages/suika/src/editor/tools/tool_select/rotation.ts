import hotkeys from 'hotkeys-js';
import { IPoint } from '../../../type.interface';
import { getClosestVal, shallowCompare } from '../../../utils/common';
import { calRadian } from '../../../utils/graphics';
import { SetElementsAttrs } from '../../commands/set_elements_attrs';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';

/**
 * 选中工具的
 * 旋转元素场景
 */
export class SelectRotationTool implements IBaseTool {
  startPointer: IPoint = { x: -1, y: -1 }; // 暂时用不上
  lastPointer: IPoint | null = null;
  prevRotation: Array<number | undefined> = [];
  rotation?: number;
  private shiftPressHandler = () => {
    if (hotkeys.shift) {
      this.rotateSelectedElements();
    }
  };

  constructor(private editor: Editor) {}

  active() {
    hotkeys('*', { keydown: true, keyup: true }, this.shiftPressHandler);
  }
  inactive() {
    hotkeys.unbind('*', this.shiftPressHandler);
  }
  start(e: PointerEvent) {
    this.startPointer = this.editor.viewportCoordsToScene(e.clientX, e.clientY);
    this.lastPointer = null;

    const selectedElements = this.editor.selectedElements.getItems();
    this.prevRotation = selectedElements.map((el) => el.rotation || 0);
  }
  drag(e: PointerEvent) {
    this.lastPointer = this.editor.viewportCoordsToScene(e.clientX, e.clientY);

    this.rotateSelectedElements();
  }
  private rotateSelectedElements() {
    const lastPointer = this.lastPointer;
    if (!lastPointer) return;

    const selectedElements = this.editor.selectedElements.getItems();
    // TODO: 多个元素旋转比较复杂，晚点再实现
    // 单个元素旋转
    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      const { x, y, width, height } = element;
      const cx = x + width / 2;
      const cy = y + height / 2;

      // 计算向量夹角
      // https://blog.fstars.wang/posts/calc-vector-angle/
      let rotation = calRadian(cx, cy, lastPointer.x, lastPointer.y);

      if (this.editor.hotkeysManager.isShiftPressing) {
        const lockRotation = this.editor.setting.lockRotation;
        rotation = getClosestVal(rotation, lockRotation);
      }

      element.rotation = rotation;
      this.rotation = rotation;

      this.editor.sceneGraph.render();
    } else if (selectedElements.length > 1) {
      throw new Error('选中的元素为多个的情况，还没实现');
    } else {
      throw new Error('选中的元素只有一个，请确认代码实现没有错误');
    }
  }
  end() {
    const selectedElements = this.editor.selectedElements.getItems();
    const finalRotation = selectedElements.map((el) => el.rotation || 0);
    if (
      this.rotation !== undefined &&
      shallowCompare(this.prevRotation, finalRotation)
    ) {
      this.editor.commandManger.pushCommand(
        new SetElementsAttrs(
          selectedElements,
          {
            rotation: this.rotation,
          },
          this.prevRotation.map((rotation) => ({ rotation }))
        )
      );
    }
  }
}
