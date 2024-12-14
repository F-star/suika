import { cloneDeep } from '@suika/common';
import {
  applyInverseMatrix,
  getSweepAngle,
  type IPoint,
  type IRect,
  type ISize,
  Matrix,
} from '@suika/geo';

import { HALF_PI } from '../constant';
import { type SuikaEditor } from '../editor';
import {
  GraphicsObjectSuffix,
  isFrameGraphics,
  type SuikaGraphics,
  SuikaLine,
} from '../graphics';
import { adjustSizeToKeepPolarSnap, getNoConflictObjectName } from '../utils';
import { DrawGraphicsTool } from './tool_draw_graphics';
import { type ITool } from './type';

const TYPE = 'drawLine';
const HOTKEY = 'l';

export class DrawLineTool extends DrawGraphicsTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  constructor(editor: SuikaEditor) {
    super(editor);
    this.commandDesc = 'Add Line';
  }

  protected createGraphics(
    rect: IRect,
    parent: SuikaGraphics,
    noMove: boolean,
  ) {
    // do not create line if no drag
    if (noMove) {
      return null;
    }
    const attrs = this.calcAttrs(rect);
    return new SuikaLine(
      {
        objectName: getNoConflictObjectName(parent, GraphicsObjectSuffix.Line),
        ...attrs,
        height: 0,
        stroke: [cloneDeep(this.editor.setting.get('firstStroke'))],
        strokeWidth: this.editor.setting.get('strokeWidth'),
      },
      {
        doc: this.editor.doc,
      },
    );
  }

  protected override adjustSizeWhenShiftPressing(rect: IRect) {
    return adjustSizeToKeepPolarSnap(rect);
  }

  protected override updateGraphics(rect: IRect) {
    const parent = this.drawingGraphics!.getParent();
    let x = rect.x;
    let y = rect.y;
    if (parent && isFrameGraphics(parent)) {
      const tf = parent.getWorldTransform();
      const point = applyInverseMatrix(tf, rect);
      x = point.x;
      y = point.y;
    }

    const attrs = this.calcAttrs({
      x,
      y,
      width: rect.width,
      height: rect.height,
    });
    this.drawingGraphics!.updateAttrs({
      width: attrs.width,
      transform: attrs.transform,
    });
  }

  protected override solveWidthOrHeightIsZero(
    size: ISize,
    delta: IPoint,
  ): ISize {
    const newSize = { width: size.width, height: size.height };
    if (size.width === 0) {
      const sign = Math.sign(delta.x) || 1;
      newSize.width = sign * this.editor.setting.get('gridSnapX');
    }
    return newSize;
  }

  private calcAttrs({ x, y, width, height }: IRect) {
    const rotate =
      getSweepAngle({ x: 0, y: -1 }, { x: width, y: height }) - HALF_PI;

    const cx = x + width / 2;
    const cy = y + height / 2;

    const tf = new Matrix()
      .translate(cx, cy)
      .rotate(rotate)
      .translate(-cx, -cy);
    tf.tx = x;
    tf.ty = y;

    return {
      width: Math.sqrt(width * width + height * height),
      transform: tf.getArray(),
    };
  }
}
