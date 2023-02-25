import { getClosestVal, nearestPixelVal } from '../utils/common';
import { Editor } from './editor';

/**
 * draw grid
 */
class Grid {
  private step = 1;
  constructor(private editor: Editor) {}
  draw() {
    const ctx = this.editor.ctx;

    const { x: offsetX, y: offsetY, width, height } = this.editor.viewportManager.getViewport();
    const zoom = this.editor.zoomManager.getZoom();
    const setting = this.editor.setting;
    const step = this.step;

    /*** draw vertical lines ***/
    let startXInScene = getClosestVal(offsetX, step);
    const endXInScene = getClosestVal(offsetX + width / zoom, step);

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
    let startYInScene = getClosestVal(offsetY, step);
    const endYInScene = getClosestVal(offsetY + height / zoom, step);

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
