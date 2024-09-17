import { cloneDeep } from '@suika/common';
import { type IRect, normalizeRect } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { SuikaFrame } from '../graphics';
import { DrawGraphicsTool } from './tool_draw_graphics';
import { type ITool } from './type';

const TYPE = 'drawFrame';
const HOTKEY = 'f';

export class DrawFrameTool extends DrawGraphicsTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  constructor(editor: SuikaEditor) {
    super(editor);
    this.commandDesc = 'Add Frame';
  }

  protected override createGraphics(rect: IRect) {
    rect = normalizeRect(rect);
    const graphics = new SuikaFrame(
      {
        objectName: '',
        width: rect.width,
        height: rect.height,
        fill: [cloneDeep(this.editor.setting.get('firstFrameFill'))],
        resizeToFit: false,
      },
      {
        advancedAttrs: {
          x: rect.x,
          y: rect.y,
        },
        doc: this.editor.doc,
      },
    );
    return graphics;
  }
}
