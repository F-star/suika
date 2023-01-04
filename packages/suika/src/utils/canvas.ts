/**
 * Canvas API 简单封装
 */

/**
 * 绘制圆
 */
export const drawCircle = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();
  ctx.closePath();
};

/**
 * 绘制时应用旋转
 */
export const rotateInCanvas = (ctx: CanvasRenderingContext2D, angle: number, cx?: number, cy?: number) => {
  const hasCenterParam = cx !== undefined && cy !== undefined;
  if (hasCenterParam) {
    ctx.translate(cx, cy);
  }
  ctx.rotate(angle);
  if (hasCenterParam) {
    ctx.translate(-cx, -cy);
  }
};