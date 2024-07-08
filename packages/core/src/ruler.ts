import { getClosestTimesVal, nearestPixelVal } from '@suika/common';

import { HALF_PI } from './constant';
import { type SuikaEditor } from './editor';
import { rotateInCanvas } from './utils';

const getStepByZoom = (zoom: number) => {
  /**
   * 步长研究，参考 figma
   * 1
   * 2
   * 5
   * 10（对应 500% 往上） 找到规律了： 50 / zoom = 步长
   * 25（对应 200% 往上）
   * 50（对应 100% 往上）
   * 100（对应 50% 往上）
   * 250
   * 500
   * 1000
   * 2500
   * 5000
   */
  const steps = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
  const step = 50 / zoom;
  for (let i = 0, len = steps.length; i < len; i++) {
    if (steps[i] >= step) return steps[i];
  }
  return steps[0];
};

/**
 * Ruler
 *
 * reference: https://mp.weixin.qq.com/s/RlNTitV3XTEKHfwpOKAQ0g
 */
class Ruler {
  visible = false;

  constructor(private editor: SuikaEditor) {}

  open() {
    this.visible = true;
  }
  close() {
    this.visible = false;
  }
  draw() {
    const setting = this.editor.setting;
    const ctx = this.editor.ctx;
    const viewport = this.editor.viewportManager.getViewport();
    const { width: viewportWidth, height: viewportHeight } = viewport;
    ctx.save();
    // 绘制背景
    ctx.fillStyle = setting.get('rulerBgColor');
    ctx.fillRect(0, 0, viewportWidth, setting.get('rulerWidth'));
    ctx.fillRect(0, 0, setting.get('rulerWidth'), viewportHeight);

    this.drawXRuler();
    this.drawYRuler();

    // 把左上角的小矩形上的刻度盖掉
    ctx.fillStyle = setting.get('rulerBgColor');
    ctx.fillRect(0, 0, setting.get('rulerWidth'), setting.get('rulerWidth'));

    // 绘制 border
    ctx.strokeStyle = setting.get('rulerStroke');
    ctx.beginPath();
    // 水平 border
    ctx.moveTo(0, setting.get('rulerWidth') + 0.5);
    ctx.lineTo(viewportWidth, setting.get('rulerWidth') + 0.5);
    ctx.stroke();
    ctx.closePath();
    // 垂直 border
    ctx.beginPath();
    ctx.moveTo(setting.get('rulerWidth') + 0.5, 0);
    ctx.lineTo(setting.get('rulerWidth') + 0.5, viewportHeight);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }
  private drawXRuler() {
    // 绘制刻度线和刻度值
    // 计算 x 轴起点和终点范围
    const setting = this.editor.setting;
    const ctx = this.editor.ctx;
    const zoom = this.editor.zoomManager.getZoom();
    const viewport = this.editor.viewportManager.getViewport();
    const stepInScene = getStepByZoom(zoom);

    const startX = setting.get('rulerWidth');
    let startXInScene = viewport.x + startX / zoom;
    startXInScene = getClosestTimesVal(startXInScene, stepInScene);

    const endX = viewport.width;
    let { x: endXInScene } = this.editor.viewportCoordsToScene(endX, 0);
    endXInScene = getClosestTimesVal(endXInScene, stepInScene);

    ctx.textAlign = 'center';
    const y = setting.get('rulerWidth') - setting.get('rulerMarkSize');
    while (startXInScene <= endXInScene) {
      ctx.strokeStyle = setting.get('rulerMarkStroke');
      ctx.fillStyle = setting.get('rulerMarkStroke');
      const x = nearestPixelVal((startXInScene - viewport.x) * zoom);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + setting.get('rulerMarkSize'));
      ctx.stroke();
      ctx.closePath();
      ctx.fillText(String(startXInScene), x, y - 4);
      startXInScene += stepInScene;
    }
  }
  private drawYRuler() {
    // 绘制刻度线和刻度值
    const setting = this.editor.setting;
    const ctx = this.editor.ctx;
    const zoom = this.editor.zoomManager.getZoom();
    const viewport = this.editor.viewportManager.getViewport();
    const stepInScene = getStepByZoom(zoom);

    const startY = setting.get('rulerWidth');
    let startYInScene = viewport.y + startY / zoom;
    startYInScene = getClosestTimesVal(startYInScene, stepInScene);

    const endY = viewport.height;
    let endYInScene = viewport.y + endY / zoom;
    endYInScene = getClosestTimesVal(endYInScene, stepInScene);

    const x = setting.get('rulerWidth') - setting.get('rulerMarkSize');
    ctx.textAlign = 'center';
    while (startYInScene <= endYInScene) {
      ctx.fillStyle = setting.get('rulerMarkStroke');
      const y = nearestPixelVal((startYInScene - viewport.y) * zoom);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + setting.get('rulerMarkSize'), y);
      ctx.stroke();
      ctx.closePath();
      rotateInCanvas(ctx, -HALF_PI, x, y);
      ctx.fillText(String(startYInScene), x, y - 3);
      rotateInCanvas(ctx, HALF_PI, x, y);
      startYInScene += stepInScene;
    }
  }
}

export default Ruler;
