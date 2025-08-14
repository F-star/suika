import { getClosestTimesVal, nearestPixelVal } from '@suika/common';

import { HALF_PI } from './constant';
import { type SuikaEditor } from './editor';
import { mergeIntervals, rotateInCanvas } from './utils';

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
export class Ruler {
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
    const rulerWidth = setting.get('rulerWidth');

    const ctx = this.editor.ctx;
    const { width: viewportWidth, height: viewportHeight } =
      this.editor.viewportManager.getPageSize();
    ctx.save();
    // 绘制背景
    ctx.fillStyle = setting.get('rulerBgColor');
    ctx.fillRect(0, 0, viewportWidth, rulerWidth);
    ctx.fillRect(0, 0, rulerWidth, viewportHeight);

    this.drawSelectArea();

    this.drawXRuler();
    this.drawYRuler();

    // 把左上角的小矩形上的刻度盖掉
    ctx.fillStyle = setting.get('rulerBgColor');
    ctx.fillRect(0, 0, rulerWidth, rulerWidth);

    // 绘制 border
    ctx.strokeStyle = setting.get('rulerStroke');
    ctx.beginPath();
    // 水平 border
    ctx.moveTo(0, rulerWidth + 0.5);
    ctx.lineTo(viewportWidth, rulerWidth + 0.5);
    ctx.stroke();
    ctx.closePath();
    // 垂直 border
    ctx.beginPath();
    ctx.moveTo(rulerWidth + 0.5, 0);
    ctx.lineTo(rulerWidth + 0.5, viewportHeight);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }
  private drawSelectArea() {
    const setting = this.editor.setting;
    const rulerWidth = setting.get('rulerWidth');
    const ctx = this.editor.ctx;

    const bboxes = this.editor.selectedElements
      .getItems()
      .map((item) => item.getBbox());

    ctx.fillStyle = setting.get('rulerSelectedBgColor');
    for (const [minX, maxX] of mergeIntervals(
      bboxes.map(({ minX, maxX }) => [minX, maxX]),
    )) {
      ctx.fillRect(
        this.editor.toViewportPt(minX, 0).x,
        0,
        this.editor.toViewportSize(maxX - minX),
        rulerWidth,
      );
    }
    for (const [minY, maxY] of mergeIntervals(
      bboxes.map(({ minY, maxY }) => [minY, maxY]),
    )) {
      ctx.fillRect(
        0,
        this.editor.toViewportPt(0, minY).y,
        rulerWidth,
        this.editor.toViewportSize(maxY - minY),
      );
    }
  }
  private drawXRuler() {
    // 绘制刻度线和刻度值
    // 计算 x 轴起点和终点范围
    const setting = this.editor.setting;
    const rulerWidth = setting.get('rulerWidth');

    const ctx = this.editor.ctx;
    const zoom = this.editor.viewportManager.getZoom();
    const stepInScene = getStepByZoom(zoom);

    const viewBbox = this.editor.viewportManager.getSceneBbox();

    const startXInScene = getClosestTimesVal(viewBbox.minX, stepInScene);

    const endXInScene = getClosestTimesVal(viewBbox.maxX, stepInScene);

    ctx.textAlign = 'center';
    const y = rulerWidth - setting.get('rulerMarkSize');
    let x = startXInScene;
    while (x <= endXInScene) {
      ctx.strokeStyle = setting.get('rulerMarkStroke');
      ctx.fillStyle = setting.get('rulerMarkStroke');
      // 转为视口坐标

      const intX = nearestPixelVal(this.editor.toViewportPt(x, 0).x);
      ctx.beginPath();
      ctx.moveTo(intX, y);
      ctx.lineTo(intX, y + setting.get('rulerMarkSize'));
      ctx.stroke();
      ctx.closePath();
      ctx.fillText(String(x), intX, y - 4);
      x += stepInScene;
    }
  }
  private drawYRuler() {
    const setting = this.editor.setting;
    const rulerWidth = setting.get('rulerWidth');

    const ctx = this.editor.ctx;
    const zoom = this.editor.viewportManager.getZoom();
    const stepInScene = getStepByZoom(zoom);

    const viewBbox = this.editor.viewportManager.getSceneBbox();
    const startYInScene = getClosestTimesVal(viewBbox.minY, stepInScene);
    const endYInScene = getClosestTimesVal(viewBbox.maxY, stepInScene);

    const x = rulerWidth - setting.get('rulerMarkSize');
    ctx.textAlign = 'center';
    ctx.fillStyle = setting.get('rulerMarkStroke');
    let y = startYInScene;
    while (y <= endYInScene) {
      const intY = nearestPixelVal(this.editor.toViewportPt(0, y).y);
      ctx.beginPath();
      ctx.moveTo(x, intY);
      ctx.lineTo(x + setting.get('rulerMarkSize'), intY);
      ctx.stroke();
      ctx.closePath();
      rotateInCanvas(ctx, -HALF_PI, x, intY);
      ctx.fillText(String(y), x, intY - 3);
      rotateInCanvas(ctx, HALF_PI, x, intY);
      y += stepInScene;
    }
  }
}
