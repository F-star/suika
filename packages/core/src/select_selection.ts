import { cloneDeep } from '@suika/common';
import { type IRect } from '@suika/geo';

import { type SuikaEditor } from './editor';

export class SelectSelection {
  private selection: IRect | null = null;
  constructor(private editor: SuikaEditor) {}

  setSelection(partialRect: Partial<IRect>) {
    this.selection = Object.assign({}, this.selection, partialRect);
  }

  getSelection() {
    return cloneDeep(this.selection);
  }

  clear() {
    this.selection = null;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const setting = this.editor.setting;
    const zoom = this.editor.viewportManager.getZoom();

    if (!this.selection) return;
    ctx.save();
    ctx.strokeStyle = setting.get('selectionStroke');
    ctx.fillStyle = setting.get('selectionFill');
    const { x, y, width, height } = this.selection;

    const { x: xInViewport, y: yInViewport } = this.editor.toViewportPt({
      x,
      y,
    });

    const widthInViewport = width * zoom;
    const heightInViewport = height * zoom;

    ctx.fillRect(xInViewport, yInViewport, widthInViewport, heightInViewport);
    ctx.strokeRect(xInViewport, yInViewport, widthInViewport, heightInViewport);
    ctx.restore();
  }
}
