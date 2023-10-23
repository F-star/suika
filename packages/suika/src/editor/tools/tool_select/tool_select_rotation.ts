import { IPoint } from '../../../type';
import { getClosestTimesVal } from '../../../utils/common';
import { calcVectorRadian, getRectCenterPoint } from '../../../utils/graphics';
import { SetElementsAttrs } from '../../commands/set_elements_attrs';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';
import { forEach } from '../../../utils/array_util';

/**
 * select tool
 * sub case: rotate selected elements
 *
 * reference: https://mp.weixin.qq.com/s/WEpYS08H44qsU4qFQx6j8Q
 */
export class SelectRotationTool implements IBaseTool {
  private lastPoint: IPoint | null = null;
  private dRotation = 0; // 按下，然后释放的整个过程中，产生的相对角度
  /** center of selected graphs */
  private centerInGraphs: [x: number, y: number] | null = null;
  private prevGraphAttrs: {
    rotation: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];

  private shiftPressHandler = () => {
    this.rotateSelectedElements();
  };

  constructor(private editor: Editor) {}

  active() {
    this.editor.hostEventManager.on('shiftToggle', this.shiftPressHandler);
  }
  inactive() {
    this.editor.hostEventManager.off('shiftToggle', this.shiftPressHandler);
  }
  start() {
    this.lastPoint = null;
    this.dRotation = 0;
    this.centerInGraphs = null;
    this.prevGraphAttrs = [];

    const selectedElements = this.editor.selectedElements.getItems();
    // 记录旋转前所有元素的（1）旋转值、（2）中点、（3）宽高 / 2
    for (let i = 0, len = selectedElements.length; i < len; i++) {
      const el = selectedElements[i];
      this.prevGraphAttrs[i] = {
        rotation: el.rotation ?? 0,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
      };
    }

    // 记录组合包围盒的中心点
    const selectedElementsBBox = this.editor.selectedElements.getBBox();
    this.centerInGraphs = selectedElementsBBox
      ? getRectCenterPoint(selectedElementsBBox)
      : null;
  }
  drag(e: PointerEvent) {
    this.lastPoint = this.editor.getSceneCursorXY(e);
    this.rotateSelectedElements();
  }
  private rotateSelectedElements() {
    const lastPoint = this.lastPoint;
    if (!lastPoint) return;

    const selectedElements = this.editor.selectedElements.getItems();
    /**** 旋转单个元素 ****/
    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      const { x, y, width, height } = element;
      const cx = x + width / 2;
      const cy = y + height / 2;

      // 计算向量夹角
      // https://blog.fstars.wang/posts/calc-vector-angle/
      let dRotation = calcVectorRadian(cx, cy, lastPoint.x, lastPoint.y);
      if (this.editor.hostEventManager.isShiftPressing) {
        const lockRotation = this.editor.setting.get('lockRotation');
        dRotation = getClosestTimesVal(dRotation, lockRotation);
      }
      this.dRotation = dRotation;

      element.rotation = dRotation;
    } else if (selectedElements.length > 1) {
      /**** 旋转多个元素 ****/
      const selectedElementsBBox = this.editor.selectedElements.getBBox();
      if (selectedElementsBBox) {
        const [cxInSelectedElementsBBox, cyInSelectedElementsBBox] = this
          .centerInGraphs as [number, number];

        let dRotation = calcVectorRadian(
          cxInSelectedElementsBBox,
          cyInSelectedElementsBBox,
          lastPoint.x,
          lastPoint.y,
        );
        if (this.editor.hostEventManager.isShiftPressing) {
          const lockRotation = this.editor.setting.get('lockRotation');
          dRotation = getClosestTimesVal(dRotation, lockRotation);
        }
        this.dRotation = dRotation;

        forEach(selectedElements, (graph, i) => {
          graph.dRotate(dRotation, this.prevGraphAttrs[i], {
            x: cxInSelectedElementsBBox,
            y: cyInSelectedElementsBBox,
          });
        });
      }
    } else {
      throw new Error('不存在选中的元素，请给我们提 issue');
    }
    this.editor.sceneGraph.render();
  }
  end() {
    const selectedElements = this.editor.selectedElements.getItems();
    const commandDesc = 'Rotate Elements';
    if (this.dRotation !== 0) {
      if (selectedElements.length === 0) {
        this.editor.commandManager.pushCommand(
          new SetElementsAttrs(
            commandDesc,
            selectedElements,
            {
              rotation: this.dRotation,
            },
            this.prevGraphAttrs.map(({ rotation }) => ({ rotation })),
          ),
        );
      } else {
        this.editor.commandManager.pushCommand(
          new SetElementsAttrs(
            commandDesc,
            selectedElements,
            selectedElements.map((el) => ({
              rotation: el.rotation,
              x: el.x,
              y: el.y,
            })),
            this.prevGraphAttrs.map(({ rotation, x, y }) => ({
              rotation,
              x,
              y,
            })),
          ),
        );
      }
    }
  }
  afterEnd() {
    // do nothing
  }
}
