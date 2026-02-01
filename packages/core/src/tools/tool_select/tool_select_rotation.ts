import { cloneDeep, getClosestTimesVal } from '@suika/common';
import {
  getSweepAngle,
  type IMatrixArr,
  type IPoint,
  rad2Deg,
} from '@suika/geo';

import { getRotationCursor } from '../../control_handle_manager';
import { type SuikaEditor } from '../../editor';
import { type SuikaGraphics } from '../../graphics';
import { Transaction } from '../../transaction';
import { type IBaseTool } from '../type';

/**
 * select tool
 * sub case: rotate selected elements
 * reference: https://mp.weixin.qq.com/s/WEpYS08H44qsU4qFQx6j8Q
 */
export class SelectRotationTool implements IBaseTool {
  private originWorldTfMap = new Map<string, IMatrixArr>();

  private transaction: Transaction;
  private selectedItems: SuikaGraphics[] = [];

  private lastPoint: IPoint | null = null;
  private startRotation = 0;
  private startBboxRotation = 0;
  private dRotation = 0; // 按下，然后释放的整个过程中，产生的相对角度
  /** center of selected graphs */
  private selectedBoxCenter: IPoint | null = null;
  handleType = '';

  private shiftPressHandler = () => {
    this.rotateSelectedGraphics();
  };

  constructor(private editor: SuikaEditor) {
    this.transaction = new Transaction(editor);
  }

  onActive() {
    this.editor.hostEventManager.on('shiftToggle', this.shiftPressHandler);
  }
  onInactive() {
    this.editor.hostEventManager.off('shiftToggle', this.shiftPressHandler);
  }
  onStart(e: PointerEvent) {
    this.selectedItems = this.editor.selectedElements.getItems({
      excludeLocked: true,
    });

    for (const graphics of this.selectedItems) {
      this.transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
      this.originWorldTfMap.set(
        graphics.attrs.id,
        graphics.getWorldTransform(),
      );
    }

    const boundingRect = this.editor.selectedElements.getBoundingRect()!;
    this.selectedBoxCenter = {
      x: boundingRect.x + boundingRect.width / 2,
      y: boundingRect.y + boundingRect.height / 2,
    };

    const mousePoint = this.editor.getSceneCursorXY(e);
    this.startRotation = getSweepAngle(
      { x: 0, y: -1 },
      {
        x: mousePoint.x - this.selectedBoxCenter.x,
        y: mousePoint.y - this.selectedBoxCenter.y,
      },
    );
    this.startBboxRotation = this.editor.selectedElements.getRotation();
  }
  onDrag(e: PointerEvent) {
    this.lastPoint = this.editor.getSceneCursorXY(e);
    this.rotateSelectedGraphics();
  }
  private rotateSelectedGraphics() {
    const lastPoint = this.lastPoint;
    if (!lastPoint) return;

    const editor = this.editor;
    const selectedItems = this.selectedItems;

    const { x: cxInSelectedElementsBBox, y: cyInSelectedElementsBBox } =
      this.selectedBoxCenter!;

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
        getClosestTimesVal(bboxRotation, lockRotation) - this.startBboxRotation;
    }

    // update cursor
    if (editor.selectedElements.getSelectedCount() === 1) {
      editor.setCursor(
        getRotationCursor(this.handleType, editor.selectedBox.getBox()!),
      );
    } else {
      editor.setCursor({
        type: 'rotation',
        degree: rad2Deg(lastMouseRotation),
      });
    }

    for (const graphics of selectedItems) {
      graphics.dRotate(
        this.dRotation,
        this.originWorldTfMap.get(graphics.attrs.id)!,
        {
          x: cxInSelectedElementsBBox,
          y: cyInSelectedElementsBBox,
        },
      );

      this.transaction.update(graphics.attrs.id, {
        transform: [...graphics.attrs.transform],
      });
    }

    this.transaction.updateParentSize(this.selectedItems);
    editor.render();
  }
  onEnd() {
    if (this.dRotation !== 0) {
      this.transaction.commit('Rotate Elements');
    }
  }
  afterEnd() {
    this.transaction = new Transaction(this.editor);
    this.lastPoint = null;
    this.dRotation = 0;
    this.selectedBoxCenter = null;
  }
}
