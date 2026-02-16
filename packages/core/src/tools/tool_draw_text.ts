import { cloneDeep } from '@suika/common';
import { type IRect, normalizeRect } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import {
  GraphicsObjectSuffix,
  type SuikaGraphics,
  SuikaText,
} from '../graphics';
import { getNoConflictObjectName } from '../utils/common';
import { DrawGraphicsTool } from './tool_draw_graphics';
import { type ITool } from './type';

const TYPE = 'drawText';
const HOTKEY = 't';

export class DrawTextTool extends DrawGraphicsTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  constructor(editor: SuikaEditor) {
    super(editor);
    this.commandDesc = 'Add Text';
  }

  protected override createGraphics(
    rect: IRect,
    parent: SuikaGraphics,
    noMove?: boolean,
  ) {
    rect = normalizeRect(rect);

    const fontSize = this.editor.setting.get('defaultFontSize');
    const defaultFontFamily = this.editor.setting.get('defaultFontFamily');

    const pt = noMove
      ? {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        }
      : { x: rect.x, y: rect.y };

    const graphics = new SuikaText(
      {
        objectName: getNoConflictObjectName(parent, GraphicsObjectSuffix.Text),
        content: '',
        fontSize,
        fontFamily: defaultFontFamily,
        width: noMove ? 0 : rect.width,
        height: noMove ? fontSize : rect.height,
        fill: [cloneDeep(this.editor.setting.get('firstTextFill'))],
        lineHeight: { value: 1, units: 'RAW' },
        letterSpacing: { value: 0, units: 'PERCENT' },
        autoFit: true,
        textAutoResize: noMove ? 'WIDTH_AND_HEIGHT' : 'NONE',
      },
      {
        advancedAttrs: pt,
        doc: this.editor.doc,
      },
    );

    return graphics;
  }

  override afterEnd(): void {
    super.afterEnd();
    this.editor.textEditor.active({
      textGraphics: this.drawingGraphics as SuikaText,
    });
  }
}
