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
  radius: number
) => {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
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
  size: number
) => {
  ctx.beginPath();
  ctx.rect(cx - size / 2, cy - size / 2, size, size);
  ctx.stroke();
  ctx.fill();
  ctx.closePath();
};

/**
 * 绘制时应用旋转
 */
export const rotateInCanvas = (
  ctx: CanvasRenderingContext2D,
  angle: number,
  cx: number,
  cy: number
) => {
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(-cx, -cy);
};
