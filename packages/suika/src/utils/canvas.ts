import { DOUBLE_PI } from '../constant';

/**
 * Canvas API 简单封装
 */

/**
 * 绘制圆
 */
export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, DOUBLE_PI);
  ctx.stroke();
  ctx.fill();
  ctx.closePath();
};

/**
 * 绘制方形
 */
export const drawSquareWithCenter = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) => {
  ctx.beginPath();
  ctx.rect(cx - size / 2, cy - size / 2, size, size);
  ctx.stroke();
  ctx.fill();
  ctx.closePath();
};

/**
 * draw x symbol
 */
export const drawXShape = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) => {
  const tl = [cx - size / 2, cy - size / 2];
  const tr = [cx + size / 2, cy - size / 2];
  const bl = [cx - size / 2, cy + size / 2];
  const br = [cx + size / 2, cy + size / 2];

  drawLine(ctx, tl[0], tl[1], br[0], br[1]);
  drawLine(ctx, tr[0], tr[1], bl[0], bl[1]);
};

/**
 * draw line
 */
export const drawLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.stroke();
};

/**
 * 绘制时应用旋转
 */
export const rotateInCanvas = (
  ctx: CanvasRenderingContext2D,
  angle: number,
  cx: number,
  cy: number,
) => {
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(-cx, -cy);
};

/**
 * draw round rect path
 */
export const drawRoundRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
};
