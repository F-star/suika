import { getClosestTimesVal, nearestPixelVal } from '@suika/common';

import { type Editor } from './editor';

/**
 * draw grid
 */
class Grid {
  private step = 1;
  constructor(private editor: Editor) {}
  draw() {
    const ctx = this.editor.ctx;

    const {
      x: offsetX,
      y: offsetY,
      width,
      height,
    } = this.editor.viewportManager.getViewport();
    const zoom = this.editor.zoomManager.getZoom();
    const setting = this.editor.setting;
    const step = this.step;

    /*** draw vertical lines ***/
    let startXInScene = getClosestTimesVal(offsetX, step);
    const endXInScene = getClosestTimesVal(offsetX + width / zoom, step);

    while (startXInScene <= endXInScene) {
      ctx.strokeStyle = setting.get('pixelGridLineColor');
      const x = nearestPixelVal((startXInScene - offsetX) * zoom);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.closePath();
      startXInScene += step;
    }

    /*** draw horizontal lines ***/
    let startYInScene = getClosestTimesVal(offsetY, step);
    const endYInScene = getClosestTimesVal(offsetY + height / zoom, step);

    while (startYInScene <= endYInScene) {
      ctx.strokeStyle = setting.get('pixelGridLineColor');
      const y = nearestPixelVal((startYInScene - offsetY) * zoom);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.closePath();
      startYInScene += step;
    }
  }
}

export default Grid;
