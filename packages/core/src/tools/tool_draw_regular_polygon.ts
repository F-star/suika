import { cloneDeep } from '@suika/common';
import { type IRect, normalizeRect } from '@suika/geo';

import { type Editor } from '../editor';
import { RegularPolygon } from '../graphs/regular_polygon';
import { DrawGraphTool } from './tool_draw_graph';
import { type ITool } from './type';

const TYPE = 'drawRegularPolygon';
const HOTKEY = '';
export class DrawRegularPolygon extends DrawGraphTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  constructor(editor: Editor) {
    super(editor);
    this.commandDesc = 'AddRegularPolygon';
  }

  protected createGraph(rect: IRect) {
    rect = normalizeRect(rect);
    return new RegularPolygon(
      {
        objectName: '',
        width: rect.width,
        height: rect.height,
        fill: [cloneDeep(this.editor.setting.get('firstFill'))],
        count: 3,
      },
      {
        x: rect.x,
        y: rect.y,
      },
    );
  }
}
