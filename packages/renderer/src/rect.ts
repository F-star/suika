import { type Canvas, type CanvasKit } from 'canvaskit-wasm';

export type RectAttrs = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class Rect {
  constructor(private attrs: RectAttrs) {}

  updateAttrs(attrs: Partial<RectAttrs>) {
    Object.assign(this.attrs, attrs);
    // TODO: 标记为 dirty
  }

  render(ctx: Canvas, CK: CanvasKit) {
    const paint = new CK.Paint();
    paint.setColor(CK.Color(255, 0, 0, 255));
    paint.setStyle(CK.PaintStyle.Stroke);
    paint.setStrokeWidth(10);

    const attrs = this.attrs;
    ctx.drawRect([attrs.x, attrs.y, attrs.width, attrs.height], paint);
  }
}
