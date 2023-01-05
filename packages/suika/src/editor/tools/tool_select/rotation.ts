import { IPoint } from '../../../type.interface';
import { shallowCompare } from '../../../utils/common';
import { calRadian } from '../../../utils/graphics';
import { SetElementsAttrs } from '../../commands/set_elements_attrs';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';

/**
 * 选中工具的
 *
 * 移动元素场景
 */
export class SelectRotationTool implements IBaseTool {
  lastPointer: IPoint = { x: -1, y: -1 };
  startPoints: IPoint[] = [];
  prevRotation: Array<number | undefined> = [];
  rotation?: number;

  constructor(private editor: Editor) {}
  start(e: PointerEvent) {
    this.lastPointer = {
      x: e.clientX,
      y: e.clientY,
    };

    const selectedElements = this.editor.selectedElements.value;
    this.prevRotation = selectedElements.map((el) => el.rotation || 0);
  }
  drag(e: PointerEvent) {
    const pointer = {
      x: e.clientX,
      y: e.clientY,
    };

    const selectedElements = this.editor.selectedElements.value;
    // TODO: 多个元素旋转比较复杂，晚点再实现
    // 单个元素旋转
    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      const { x, y, width, height } = element;
      const cx = x + width / 2;
      const cy = y + height / 2;

      // 计算向量夹角
      // https://blog.fstars.wang/posts/calc-vector-angle/
      const rotation = calRadian(cx, cy, pointer.x, pointer.y);
      element.rotation = rotation;
      this.rotation = rotation;

      this.editor.sceneGraph.render();
    } else if (selectedElements.length > 1) {
      throw new Error('选中的元素为多个的情况，还没实现');
    } else {
      throw new Error('选中的元素只有一个');
    }
  }
  end(e: PointerEvent) {
    const selectedElements = this.editor.selectedElements.value;
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
