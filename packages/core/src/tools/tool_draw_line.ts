import { cloneDeep } from '@suika/common';
import { type IRect, normalizeRadian, transformRotate } from '@suika/geo';

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

  private calcAttrs({ x, y, width, height }: IRect) {
    const rotation = normalizeRadian(Math.atan2(height, width));
    const cx = x + width / 2;
    const cy = y + height / 2;
    const p = transformRotate(x, y, -rotation, cx, cy);
    width = Math.sqrt(width * width + height * height);
    return {
      x: p.x,
      y: p.y,
      width,
      rotation,
    };
  }
}
