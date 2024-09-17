import { cloneDeep } from '@suika/common';
import { type IRect, normalizeRect } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { SuikaEllipse } from '../graphics';
import { DrawGraphicsTool } from './tool_draw_graphics';
import { type ITool } from './type';

const TYPE = 'drawEllipse';
const HOTKEY = 'o';
export class DrawEllipseTool extends DrawGraphicsTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  constructor(editor: SuikaEditor) {
    super(editor);
    this.commandDesc = 'Add Ellipse';
  }

  protected createGraphics(rect: IRect) {
    rect = normalizeRect(rect);
    return new SuikaEllipse(
      {
        objectName: '',
        width: rect.width,
        height: rect.height,
        fill: [cloneDeep(this.editor.setting.get('firstFill'))],
      },
      {
        advancedAttrs: {
          x: rect.x,
          y: rect.y,
        },
        doc: this.editor.doc,
      },
    );
  }
}
