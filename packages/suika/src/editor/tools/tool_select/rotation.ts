import hotkeys from 'hotkeys-js';
import { IPoint } from '../../../type.interface';
import { getClosestVal } from '../../../utils/common';
import { calcVectorRadian, getRectCenterPoint, normalizeAngle } from '../../../utils/graphics';
import { transformRotate } from '../../../utils/transform';
import { SetElementsAttrs } from '../../commands/set_elements_attrs';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';

/**
 * 选中工具的
 * 旋转元素场景
 */
export class SelectRotationTool implements IBaseTool {
  private startPointer: IPoint = { x: -1, y: -1 }; // 暂时用不上
  private lastPointer: IPoint | null = null;
  private dRotation = 0; // 按下，然后释放的整个过程中，产生的相对角度

  private selectedElementsBBoxCenter: [x: number, y: number] | null = null;
  private prevRotations: number[] = [];
  private prevElementXYs: [x: number, y: number][] = [];
  private prevElementCenters: [x: number, y: number][] = [];
  private prevElementHalfSizes: [width: number, height: number][] = [];

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
    const viewportPos = this.editor.getPointerXY(e);
    this.startPointer = this.editor.viewportCoordsToScene(viewportPos.x, viewportPos.y);
    this.lastPointer = null;
    this.dRotation = 0;

    const selectedElements = this.editor.selectedElements.getItems();

    this.prevRotations = [];
    this.prevElementCenters = [];
    this.prevElementHalfSizes = [];
    // 记录旋转前所有元素的（1）旋转值、（2）中点、（3）宽高 / 2
    for (let i = 0, len = selectedElements.length; i < len; i++) {
      const el = selectedElements[i];
      this.prevRotations[i] = el.rotation || 0;
      const bBox = el.getBBoxWithoutRotation();
      this.prevElementXYs[i] = [bBox.x, bBox.y];
      this.prevElementCenters[i] = getRectCenterPoint(bBox);
      this.prevElementHalfSizes[i] = [bBox.width / 2, bBox.height / 2];
    }

    // 记录组合包围盒的中心点
    const selectedElementsBBox = this.editor.selectedElements.getBBox();
    this.selectedElementsBBoxCenter = selectedElementsBBox ? getRectCenterPoint(selectedElementsBBox) : null;
  }
  drag(e: PointerEvent) {
    const viewportPos = this.editor.getPointerXY(e);
    this.lastPointer = this.editor.viewportCoordsToScene(viewportPos.x, viewportPos.y);

    this.rotateSelectedElements();
  }
  private rotateSelectedElements() {
    const lastPointer = this.lastPointer;
    if (!lastPointer) return;

    const selectedElements = this.editor.selectedElements.getItems();
    /**** 旋转单个元素 ****/
    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      const { x, y, width, height } = element;
      const cx = x + width / 2;
      const cy = y + height / 2;

      // 计算向量夹角
      // https://blog.fstars.wang/posts/calc-vector-angle/
      let dRotation = calcVectorRadian(cx, cy, lastPointer.x, lastPointer.y);
      if (this.editor.hostEventManager.isShiftPressing) {
        const lockRotation = this.editor.setting.lockRotation;
        dRotation = getClosestVal(dRotation, lockRotation);
      }
      this.dRotation = dRotation;

      element.rotation = dRotation;
    }
    /**** 旋转多个元素 ****/
    else if (selectedElements.length > 1) {
      const selectedElementsBBox = this.editor.selectedElements.getBBox();
      if (selectedElementsBBox) {
        const [cxInSelectedElementsBBox, cyInSelectedElementsBBox] =
          this.selectedElementsBBoxCenter as [number, number];

        let dRotation = calcVectorRadian(
          cxInSelectedElementsBBox,
          cyInSelectedElementsBBox,
          lastPointer.x,
          lastPointer.y
        );
        if (this.editor.hostEventManager.isShiftPressing) {
          const lockRotation = this.editor.setting.lockRotation;
          dRotation = getClosestVal(dRotation, lockRotation);
        }
        this.dRotation = dRotation;

        const prevElementCenters = this.prevElementCenters;
        const prevElementHalfSizes = this.prevElementHalfSizes;
        for (let i = 0, len = selectedElements.length; i < len; i++) {
          const el = selectedElements[i];
          // 计算新的旋转角度
          el.rotation = normalizeAngle(this.prevRotations[i] + dRotation);

          const [cx, cy] = prevElementCenters[i];
          const [newCx, newCy] = transformRotate(
            cx,
            cy,
            dRotation,
            cxInSelectedElementsBBox,
            cyInSelectedElementsBBox
          );

          const x = newCx - prevElementHalfSizes[i][0];
          const y = newCy - prevElementHalfSizes[i][1];

          el.x = x;
          el.y = y;
        }
      }
    } else {
      throw new Error('不存在选中的元素，请给我们提 issue');
    }
    this.editor.sceneGraph.render();
  }
  end() {
    const selectedElements = this.editor.selectedElements.getItems();
    if (this.dRotation !== 0) {
      if (selectedElements.length === 0) {
        this.editor.commandManger.pushCommand(
          new SetElementsAttrs(
            selectedElements,
            {
              rotation: this.dRotation,
            },
            this.prevRotations.map((rotation) => ({ rotation }))
          )
        );
      } else {
        this.editor.commandManger.pushCommand(
          new SetElementsAttrs(
            selectedElements,
            selectedElements.map((el) => ({
              rotation: el.rotation,
              x: el.x,
              y: el.y,
            })),
            this.prevRotations.map((rotation, index) => ({
              rotation,
              x: this.prevElementXYs[index][0],
              y: this.prevElementXYs[index][1],
            }))
          )
        );
      }
      // TODO: 多选的历史记录实现
    }
  }
}
