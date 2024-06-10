import { getClosestTimesVal } from '@suika/common';
import {
  getSweepAngle,
  type IMatrixArr,
  type IPoint,
  rad2Deg,
} from '@suika/geo';

import { UpdateGraphicsAttrsCmd } from '../../commands';
import { getRotationCursor } from '../../control_handle_manager';
import { type Editor } from '../../editor';
import { type GraphicsAttrs } from '../../graphs';
import { type IBaseTool } from '../type';
import { updateParentSize } from './utils';

/**
 * select tool
 * sub case: rotate selected elements
 * reference: https://mp.weixin.qq.com/s/WEpYS08H44qsU4qFQx6j8Q
 */
export class SelectRotationTool implements IBaseTool {
  private originWorldTfMap = new Map<string, IMatrixArr>();
  private originAttrsMap = new Map<string, Partial<GraphicsAttrs>>();
  private updatedAttrsMap = new Map<string, Partial<GraphicsAttrs>>();

  private lastPoint: IPoint | null = null;
  private startRotation = 0;
  private startBboxRotation = 0;
  private dRotation = 0; // 按下，然后释放的整个过程中，产生的相对角度
  /** center of selected graphs */
  private selectedBoxCenter: [x: number, y: number] | null = null;
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
    const selectedElements = this.editor.selectedElements.getItems({
      excludeLocked: true,
    });

    for (const graphics of selectedElements) {
      this.originAttrsMap.set(graphics.attrs.id, {
        transform: [...graphics.attrs.transform],
      });

      this.originWorldTfMap.set(
        graphics.attrs.id,
        graphics.getWorldTransform(),
      );
    }

    this.selectedBoxCenter = this.editor.selectedElements.getCenterPoint();

    const mousePoint = this.editor.getSceneCursorXY(e);
    this.startRotation = getSweepAngle(
      { x: 0, y: -1 },
      {
        x: mousePoint.x - this.selectedBoxCenter[0],
        y: mousePoint.y - this.selectedBoxCenter[1],
      },
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

    const editor = this.editor;
    const selectedElements = editor.selectedElements.getItems();
    /**** 旋转多个元素 ****/
    const selectedElementsBBox = editor.selectedElements.getBbox();
    if (selectedElementsBBox) {
      const [cxInSelectedElementsBBox, cyInSelectedElementsBBox] = this
        .selectedBoxCenter as [number, number];

      const lastMouseRotation = getSweepAngle(
        { x: 0, y: -1 },
        {
          x: lastPoint.x - cxInSelectedElementsBBox,
          y: lastPoint.y - cyInSelectedElementsBBox,
        },
      );

      this.dRotation = lastMouseRotation - this.startRotation;
      if (editor.hostEventManager.isShiftPressing) {
        const lockRotation = editor.setting.get('lockRotation');
        const bboxRotation = this.startBboxRotation + this.dRotation;
        this.dRotation =
          getClosestTimesVal(bboxRotation, lockRotation) -
          this.startBboxRotation;
      }

      if (editor.selectedElements.size() === 1) {
        editor.setCursor(
          getRotationCursor(this.handleType, editor.selectedBox.getBox()!),
        );
      } else {
        editor.setCursor({
          type: 'rotation',
          degree: rad2Deg(lastMouseRotation),
        });
      }

      for (const graphics of selectedElements) {
        graphics.dRotate(
          this.dRotation,
          this.originWorldTfMap.get(graphics.attrs.id)!,
          {
            x: cxInSelectedElementsBBox,
            y: cyInSelectedElementsBBox,
          },
        );

        this.updatedAttrsMap.set(graphics.attrs.id, {
          transform: [...graphics.attrs.transform],
        });
      }

      updateParentSize(
        this.editor,
        this.editor.selectedElements.getParentIdSet(),
        this.originAttrsMap,
        this.updatedAttrsMap,
      );
    } else {
      throw new Error('no selected elements, please report issue');
    }
    editor.render();
  }
  onEnd() {
    const commandDesc = 'Rotate Elements';
    if (this.dRotation !== 0) {
      this.editor.commandManager.pushCommand(
        new UpdateGraphicsAttrsCmd(
          commandDesc,
          this.editor,
          this.originAttrsMap,
          this.updatedAttrsMap,
        ),
      );
    }
  }
  afterEnd() {
    this.originAttrsMap = new Map();
    this.updatedAttrsMap = new Map();
    this.lastPoint = null;
    this.dRotation = 0;
    this.selectedBoxCenter = null;
  }
}
