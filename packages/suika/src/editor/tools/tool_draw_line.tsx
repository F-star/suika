import cloneDeep from 'lodash.clonedeep';
import { Editor } from '../editor';
import { Line } from '../scene/line';
import { DrawGraphTool } from './tool_draw_graph';
import { ITool } from './type';
import { IRect } from '../../type';
import { calcVectorRadian, normalizeRadian } from '../../utils/graphics';
import { transformRotate } from '../../utils/transform';
import { HALF_PI } from '../../constant';

export class DrawLineTool extends DrawGraphTool implements ITool {
  static readonly type = 'drawLine';
  readonly type = 'drawLine';
  readonly hotkey = 'l';

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
      ...attrs,
      height: 0,
      stroke: [cloneDeep(this.editor.setting.get('firstStroke'))],
      strokeWidth: this.editor.setting.get('strokeWidth'),
    });
  }

  protected adjustSizeWhenShiftPressing(rect: IRect) {
    const radian = calcVectorRadian(
      rect.x,
      rect.y,
      rect.x + rect.width,
      rect.y + rect.height,
    );

    const { width, height } = rect;
    const remainder = radian % HALF_PI;
    if (remainder < Math.PI / 8 || remainder > (Math.PI * 3) / 8) {
      if (Math.abs(width) > Math.abs(height)) {
        rect.height = 0;
      } else {
        rect.width = 0;
      }
    } else {
      const min = Math.min(Math.abs(width), Math.abs(height));
      const max = Math.max(Math.abs(width), Math.abs(height));
      const size = min + (max - min) / 2;

      rect.height = (Math.sign(height) || 1) * size;
      rect.width = (Math.sign(width) || 1) * size;
    }
  }

  protected updateGraph(rect: IRect) {
    const attrs = this.calcAttrs(rect);
    Object.assign(this.drawingGraph!, attrs);
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
