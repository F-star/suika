import { cloneDeep } from '@suika/common';
import { type IRect, normalizeRect } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import {
  GraphicsObjectSuffix,
  type SuikaGraphics,
  SuikaRect,
} from '../graphics';
import { getNoConflictObjectName } from '../utils';
import { DrawGraphicsTool } from './tool_draw_graphics';
import { type ITool } from './type';

const TYPE = 'drawRect';
const HOTKEY = 'r';

export class DrawRectTool extends DrawGraphicsTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  constructor(editor: SuikaEditor) {
    super(editor);
    this.commandDesc = 'Add Rect';
  }

  protected override createGraphics(rect: IRect, parent: SuikaGraphics) {
    rect = normalizeRect(rect);
    const graphics = new SuikaRect(
      {
        objectName: getNoConflictObjectName(parent, GraphicsObjectSuffix.Rect),
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
    return graphics;
  }
}
