import { cloneDeep } from '@suika/common';
import { type IRect, normalizeRect } from '@suika/geo';

import { type Editor } from '../editor';
import { SuikaStar } from '../graphs/star';
import { DrawGraphTool } from './tool_draw_graph';
import { type ITool } from './type';

const TYPE = 'drawStar';
const HOTKEY = '';
export class DrawStar extends DrawGraphTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  constructor(editor: Editor) {
    super(editor);
    this.commandDesc = 'AddStar';
  }

  protected createGraph(rect: IRect) {
    rect = normalizeRect(rect);
    return new SuikaStar(
      {
        objectName: '',
        width: rect.width,
        height: rect.height,
        fill: [cloneDeep(this.editor.setting.get('firstFill'))],
        count: 5,
        starInnerScale: this.editor.setting.get('defaultStarInnerScale'),
      },
      {
        advancedAttrs: { x: rect.x, y: rect.y },
        doc: this.editor.doc,
      },
    );
  }
}
