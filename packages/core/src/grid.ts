import {
  getClosestTimesVal,
  getDevicePixelRatio,
  nearestPixelVal,
} from '@suika/common';
import { Container, Graphics } from 'pixi.js';

import { type Editor } from './editor';

/**
 * draw grid
 */
class Grid {
  private gridGraphics = new Container();
  constructor(private editor: Editor) {
    this.bindEvent();
  }

  getGraphics() {
    return this.gridGraphics;
  }

  draw = () => {
    const gridView = this.gridGraphics;
    gridView.removeChildren();

    const zoom = this.editor.zoomManager.getZoom();
    const setting = this.editor.setting;

    if (
      !(
        setting.get('enablePixelGrid') &&
        zoom >= this.editor.setting.get('minPixelGridZoom')
      )
    ) {
      return;
    }

    const {
      x: offsetX,
      y: offsetY,
      width,
      height,
    } = this.editor.viewportManager.getViewport();
    const stepX = this.editor.setting.get('gridViewX');
    const stepY = this.editor.setting.get('gridViewY');

    /*** draw vertical lines ***/
    let startXInScene = getClosestTimesVal(offsetX, stepX);
    const endXInScene = getClosestTimesVal(offsetX + width / zoom, stepX);

    const strokeColor = setting.get('pixelGridLineColor');
    const strokeWidth = 1 / getDevicePixelRatio();

    while (startXInScene <= endXInScene) {
      const x = nearestPixelVal((startXInScene - offsetX) * zoom);
      const line = new Graphics().moveTo(x, 0).lineTo(x, height).stroke({
        color: strokeColor,
        width: strokeWidth,
      });
      gridView.addChild(line);

      startXInScene += stepX;
    }

    /*** draw horizontal lines ***/
    let startYInScene = getClosestTimesVal(offsetY, stepY);
    const endYInScene = getClosestTimesVal(offsetY + height / zoom, stepY);

    while (startYInScene <= endYInScene) {
      const y = nearestPixelVal((startYInScene - offsetY) * zoom);
      const line = new Graphics().moveTo(0, y).lineTo(width, y).stroke({
        color: strokeColor,
        width: strokeWidth,
      });
      gridView.addChild(line);

      startYInScene += stepY;
    }
  };

  destroy() {
    this.unbindEvent();
  }

  private bindEvent() {
    this.editor.zoomManager.on('zoomChange', this.draw);
    this.editor.viewportManager.on('xOrYChange', this.draw);
    this.editor.viewportManager.on('sizeChange', this.draw);
  }
  private unbindEvent() {
    this.editor.zoomManager.off('zoomChange', this.draw);
    this.editor.viewportManager.on('xOrYChange', this.draw);
    this.editor.viewportManager.on('sizeChange', this.draw);
  }
}

export default Grid;
