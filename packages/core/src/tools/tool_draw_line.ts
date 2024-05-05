import { cloneDeep } from '@suika/common';
import {
  getSweepAngle,
  type IMatrixArr,
  type IPoint,
  type IRect,
  type ISize,
} from '@suika/geo';
import { Matrix } from 'pixi.js';

import { HALF_PI } from '../constant';
import { type Editor } from '../editor';
import { Line } from '../graphs';
import { adjustSizeToKeepPolarSnap } from '../utils';
import { DrawGraphTool } from './tool_draw_graph';
import { type ITool } from './type';

const TYPE = 'drawLine';
const HOTKEY = 'l';

export class DrawLineTool extends DrawGraphTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  constructor(editor: Editor) {
    super(editor);
    this.commandDesc = 'Add Line';
  }

  protected createGraph(rect: IRect, noMove: boolean) {
    // do not create line if no drag
    if (noMove) {
      return null;
    }
    const attrs = this.calcAttrs(rect);
    return new Line({
      objectName: '',
      ...attrs,
      height: 0,
      stroke: [cloneDeep(this.editor.setting.get('firstStroke'))],
      strokeWidth: this.editor.setting.get('strokeWidth'),
    });
  }

  protected override adjustSizeWhenShiftPressing(rect: IRect) {
    return adjustSizeToKeepPolarSnap(rect);
  }

  protected override updateGraph(rect: IRect) {
    const attrs = this.calcAttrs(rect);
    this.drawingGraph!.updateAttrs(attrs);
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
      transform: [tf.a, tf.b, tf.c, tf.d, tf.tx, tf.ty] as IMatrixArr,
    };
  }
}
