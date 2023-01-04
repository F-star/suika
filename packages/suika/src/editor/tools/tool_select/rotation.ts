import { IPoint } from '../../../type.interface';
import { calRadian } from '../../../utils/graphics';
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
  dx = 0;
  dy = 0;

  constructor(private editor: Editor) {}
  start(e: PointerEvent) {
    this.lastPointer = {
      x: e.clientX,
      y: e.clientY,
    };
  }
  drag(e: PointerEvent) {
    const pointer = {
      x: e.clientX,
      y: e.clientY,
    };
    // 计算旋转角度
    const selectedElements = this.editor.selectedElements.value;
    // TODO: 多个元素旋转比较复杂，晚点再实现
    // 单个元素旋转
    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      const { x, y, width, height } = element;
      const cx = x + width / 2;
      const cy = y + height / 2;

      const radian = calRadian(cx, cy, pointer.x, pointer.y);

      // let radian = (5 * Math.PI) / 2 + Math.atan2(pointer.x - cy, pointer.y - cx);
      // if (radian >= 2 * Math.PI) {
      //   radian = radian - 2 * Math.PI;
      // }


      // console.log(radian);
      element.rotation = radian; // 随便赋一个值，方便测试

      this.editor.sceneGraph.render();
    }
  }
  end(e: PointerEvent) {
    //
  }
}
