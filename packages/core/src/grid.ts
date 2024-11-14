import { getClosestTimesVal, nearestPixelVal } from '@suika/common';

import { type SuikaEditor } from './editor';

/**
 * draw grid
 */
class Grid {
  constructor(private editor: SuikaEditor) {}
  draw() {
    const ctx = this.editor.ctx;
    ctx.save();

    const {
      x: offsetX,
      y: offsetY,
      width,
      height,
    } = this.editor.viewportManager.getViewport();
    const zoom = this.editor.zoomManager.getZoom();
    const setting = this.editor.setting;
    const stepX = this.editor.setting.get('gridViewX');
    const stepY = this.editor.setting.get('gridViewY');

    /*** draw vertical lines ***/
    let startXInScene = getClosestTimesVal(offsetX, stepX);
    const endXInScene = getClosestTimesVal(offsetX + width / zoom, stepX);

    while (startXInScene <= endXInScene) {
      ctx.strokeStyle = setting.get('pixelGridLineColor');
      const x = nearestPixelVal((startXInScene - offsetX) * zoom);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.closePath();
      startXInScene += stepX;
    }

    /*** draw horizontal lines ***/
    let startYInScene = getClosestTimesVal(offsetY, stepY);
    const endYInScene = getClosestTimesVal(offsetY + height / zoom, stepY);

    while (startYInScene <= endYInScene) {
      ctx.strokeStyle = setting.get('pixelGridLineColor');
      const y = nearestPixelVal((startYInScene - offsetY) * zoom);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.closePath();
      startYInScene += stepY;
    }

    ctx.restore();
  }
}

export default Grid;
