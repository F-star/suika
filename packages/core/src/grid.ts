import { getClosestTimesVal, nearestPixelVal } from '@suika/common';

import { type SuikaEditor } from './editor';

export class Grid {
  constructor(private editor: SuikaEditor) {}
  draw() {
    const ctx = this.editor.ctx;
    ctx.save();

    const setting = this.editor.setting;
    const stepX = this.editor.setting.get('gridViewX');
    const stepY = this.editor.setting.get('gridViewY');

    /*** draw vertical lines ***/
    const bbox = this.editor.viewportManager.getSceneBbox();
    const pageSize = this.editor.viewportManager.getPageSize();

    const startXInScene = getClosestTimesVal(bbox.minX, stepX);
    const endXInScene = getClosestTimesVal(bbox.maxX, stepX);

    let x = startXInScene;
    while (x <= endXInScene) {
      ctx.strokeStyle = setting.get('pixelGridLineColor');
      const pixelX = nearestPixelVal(this.editor.toViewportPt(x, 0).x);
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, pageSize.height);
      ctx.stroke();
      ctx.closePath();
      x += stepX;
    }

    /*** draw horizontal lines ***/
    let startYInScene = getClosestTimesVal(bbox.minY, stepY);
    const endYInScene = getClosestTimesVal(bbox.maxY, stepY);

    while (startYInScene <= endYInScene) {
      ctx.strokeStyle = setting.get('pixelGridLineColor');
      const y = nearestPixelVal(this.editor.toViewportPt(0, startYInScene).y);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(pageSize.width, y);
      ctx.stroke();
      ctx.closePath();
      startYInScene += stepY;
    }

    ctx.restore();
  }
}
