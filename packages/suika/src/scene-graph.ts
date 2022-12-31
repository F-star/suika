import { Editor } from './editor/editor';
import { IBox, IRect } from './type.interface';
import { genId } from './utils/common';
import { getRectsBBox, isRectIntersect } from './utils/graphics';

/**
 * 图形树
 */
export class SceneGraph {
  // private map = new Map<string, any>();
  children: any[] = [];
  constructor(private editor: Editor) {}
  // 添加矩形
  addRect(rect: RectGraph): Rect {
    const rectShape = new Rect(rect);
    this.children.push(rectShape);
    return rectShape;
  }
  appendChild(element: Rect, idx: number) {
    this.children.splice(idx, 0, element);
  }
  removeChild(element: Rect) {
    const idx = this.children.indexOf(element as any);
    if (idx !== -1) {
      this.children.splice(idx, 1);
    }
    return idx;
  }
  // 全局重渲染
  render() {
    // 获取视口区域
    const { viewport, canvasElement: canvas, ctx } = this.editor;

    const visibleElements: any[] = [];
    // 1. 找出视口下所有矩形
    // 暂时都认为是矩形
    for (let i = 0, len = this.children.length; i < len; i++) {
      const shape = this.children[i];
      if (isRectIntersect(shape.getBBox(), viewport)) {
        visibleElements.push(shape);
      }
    }
    // 2. 绘制它们
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0, len = visibleElements.length; i < len; i++) {
      const element = visibleElements[i];
      if (element instanceof Rect) {
        ctx.fillStyle = element.fill;
        // ctx.strokeStyle = element._stroke;
        ctx.fillRect(
          element.x,
          element.y,
          element.width,
          element.height
        );
      }
    }
    // TODO: 3. 绘制辅助线
    if (this.editor.selectedElements.value.length) {
      this.highLightSelectedBox();
    }
  }
  private highLightSelectedBox() {
    // 1. 计算选中盒
    const selectedElements = this.editor.selectedElements.value;
    const bBoxes = selectedElements.map(element => element.getBBox());

    if (bBoxes.length < 0) {
      return;
    }

    const composedBBox = getRectsBBox(...bBoxes);

    // 2. 高亮选中盒
    const ctx = this.editor.ctx;
    ctx.save();
    ctx.strokeStyle = this.editor.setting.guideBBoxStroke;
    ctx.strokeRect(composedBBox.x, composedBBox.y, composedBBox.width, composedBBox.height);
    ctx.restore();

    // 3. 绘制缩放控制点
    // TODO:
  }
}

interface IGraph {
  x: number;
  y: number;
  // 颜色
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // transform 相关
  rotate?: number;
}

interface RectGraph extends IGraph, IRect {}

export class Rect {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  // _bbox: IBox

  constructor({ x, y, width, height, fill }: RectGraph) {
    this.id = genId();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.fill = fill || '';

    // TODO: 计算包围盒缓存起来
  }
  getBBox(): IBox {
    // FIXME: 没考虑描边宽度
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.fill;
    // ctx.strokeStyle = this._stroke;
    ctx.fillRect(
      this.x,
      this.y,
      this.width,
      this.height,
    );
  }
}
