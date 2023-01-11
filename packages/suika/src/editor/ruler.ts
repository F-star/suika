import { getClosestVal } from '../utils/common';
import { Editor } from './editor';

/**
 * 步长研究
 * 应该是有一个最小视口步长、和一个最大视口步长控制？
 *
 * 1
 * 2
 * 5
 * 10
 * 25
 * 50（对应 100%）
 * 100
 * 250
 * 500
 * 1000
 * 2500
 * 5000
 */

class Ruler {
  visible = false;

  constructor(private editor: Editor) {}

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
    ctx.fillStyle = setting.rulerBgColor;
    ctx.fillRect(0, 0, viewportWidth, setting.rulerWidth);
    ctx.fillRect(0, 0, setting.rulerWidth, viewportHeight);

    this.drawXRuler();

    // 绘制 border
    ctx.strokeStyle = setting.rulerStroke;
    ctx.beginPath();
    // 水平 border
    ctx.moveTo(0, setting.rulerWidth + 0.5);
    ctx.lineTo(viewportWidth, setting.rulerWidth + 0.5);
    ctx.stroke();
    ctx.closePath();
    // 垂直 border
    ctx.beginPath();
    ctx.moveTo(setting.rulerWidth + 0.5, 0);
    ctx.lineTo(setting.rulerWidth + 0.5, viewportHeight);
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
    const stepInScene = 50;

    const startX = setting.rulerWidth;
    let { x: startXInScene } = this.editor.viewportCoordsToScene(startX, 0);
    startXInScene = getClosestVal(startXInScene, stepInScene);

    const endX = viewport.width;
    let { x: endXInScene } = this.editor.viewportCoordsToScene(endX, 0);
    endXInScene = getClosestVal(endXInScene, stepInScene);

    while (startXInScene <= endXInScene) {
      ctx.fillStyle = setting.rulerMarkStroke;
      const x = (startXInScene - viewport.x) * zoom;
      const y = setting.rulerWidth - setting.rulerMarkSize;
      ctx.fillRect(
        x,
        y,
        1,
        setting.rulerMarkSize + 0.5
      );
      ctx.fillText(String(startXInScene), x, y - 3);
      startXInScene += stepInScene;
    }
  }
}

export default Ruler;
