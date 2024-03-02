import { forEach, getClosestTimesVal } from '@suika/common';
import { normalizeRadian, rad2Deg } from '@suika/geo';

import { SetGraphsAttrsCmd } from '../../commands/set_elements_attrs';
import { getRotationCursor } from '../../control_handle_manager';
import { Editor } from '../../editor';
import { IPoint } from '../../type';
import { calcVectorRadian } from '../../utils';
import { IBaseTool } from '../type';

/**
 * select tool
 * sub case: rotate selected elements
 *
 * reference: https://mp.weixin.qq.com/s/WEpYS08H44qsU4qFQx6j8Q
 */
export class SelectRotationTool implements IBaseTool {
  private lastPoint: IPoint | null = null;
  private startRotation = 0;
  private startBboxRotation = 0;
  private dRotation = 0; // 按下，然后释放的整个过程中，产生的相对角度
  /** center of selected graphs */
  private selectedBoxCenter: [x: number, y: number] | null = null;
  private prevGraphAttrs: {
    rotation: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  handleType = '';

  private shiftPressHandler = () => {
    this.rotateSelectedElements();
  };

  constructor(private editor: Editor) {}

  onActive() {
    this.editor.hostEventManager.on('shiftToggle', this.shiftPressHandler);
  }
  onInactive() {
    this.editor.hostEventManager.off('shiftToggle', this.shiftPressHandler);
  }
  onStart(e: PointerEvent) {
    this.lastPoint = null;
    this.dRotation = 0;
    this.selectedBoxCenter = null;
    this.prevGraphAttrs = [];

    const selectedElements = this.editor.selectedElements.getItems();
    // 记录旋转前所有元素的（1）旋转值、（2）中点、（3）宽高 / 2
    for (let i = 0, len = selectedElements.length; i < len; i++) {
      const el = selectedElements[i];
      this.prevGraphAttrs[i] = {
        ...el.getRect(),
        rotation: el.attrs.rotation ?? 0,
      };
    }

    this.selectedBoxCenter = this.editor.selectedElements.getCenterPoint(); // getRectCenterPoint(selectedElementsBBox);

    const mousePoint = this.editor.getSceneCursorXY(e);
    this.startRotation = calcVectorRadian(
      this.selectedBoxCenter[0],
      this.selectedBoxCenter[1],
      mousePoint.x,
      mousePoint.y,
    );
    this.startBboxRotation = this.editor.selectedElements.getRotation();
  }
  onDrag(e: PointerEvent) {
    this.lastPoint = this.editor.getSceneCursorXY(e);
    this.rotateSelectedElements();
  }
  private rotateSelectedElements() {
    const lastPoint = this.lastPoint;
    if (!lastPoint) return;

    const selectedElements = this.editor.selectedElements.getItems();
    /**** 旋转多个元素 ****/
    const selectedElementsBBox = this.editor.selectedElements.getBBox();
    if (selectedElementsBBox) {
      const [cxInSelectedElementsBBox, cyInSelectedElementsBBox] = this
        .selectedBoxCenter as [number, number];

      const lastMouseRotation = calcVectorRadian(
        cxInSelectedElementsBBox,
        cyInSelectedElementsBBox,
        lastPoint.x,
        lastPoint.y,
      );

      this.dRotation = lastMouseRotation - this.startRotation;
      if (this.editor.hostEventManager.isShiftPressing) {
        const lockRotation = this.editor.setting.get('lockRotation');
        const bboxRotation = this.startBboxRotation + this.dRotation;
        this.dRotation =
          getClosestTimesVal(bboxRotation, lockRotation) -
          this.startBboxRotation;
      }
      this.dRotation = normalizeRadian(this.dRotation);

      if (this.editor.selectedElements.size() === 1) {
        this.editor.setCursor(
          getRotationCursor(this.handleType, this.editor.selectedBox.getBox()!),
        );
      } else {
        this.editor.setCursor({
          type: 'rotation',
          degree: rad2Deg(lastMouseRotation),
        });
      }

      forEach(selectedElements, (graph, i) => {
        graph.dRotate(this.dRotation, this.prevGraphAttrs[i], {
          x: cxInSelectedElementsBBox,
          y: cyInSelectedElementsBBox,
        });
      });
    } else {
      throw new Error('no selected elements, please report issue');
    }
    this.editor.render();
  }
  onEnd() {
    const selectedElements = this.editor.selectedElements.getItems();
    const commandDesc = 'Rotate Elements';
    if (this.dRotation !== 0) {
      this.editor.commandManager.pushCommand(
        new SetGraphsAttrsCmd(
          commandDesc,
          selectedElements,
          selectedElements.map((el) => ({
            rotation: el.attrs.rotation,
            x: el.attrs.x,
            y: el.attrs.y,
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
  afterEnd() {
    // do nothing
  }
}
