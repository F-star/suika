import { Editor } from './editor/editor';
import { IBox, IRect } from './type.interface';
import { genId } from './utils/common';
import { isRectIntersect } from './utils/graphics';

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
  removeChild(element: Rect) {
    const idx = this.children.findIndex(element as any);
    if (idx !== -1) {
      this.children.splice(idx, 1);
    }
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
        ctx.fillStyle = element._fill;
        // ctx.strokeStyle = element._stroke;
        ctx.fillRect(
          element.x(),
          element.y(),
          element.width(),
          element.height()
        );
      }
    }
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
  _id: number;
  _x: number;
  _y: number;
  _width: number;
  _height: number;
  _fill: string;
  // _bbox: IBox

  constructor({ x, y, width, height, fill }: RectGraph) {
    this._id = genId();
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;

    this._fill = fill || '';

    // TODO: 计算包围盒缓存起来
  }
  x(val: number): void;
  x(): number;
  x(val?: number) {
    if (val !== undefined) {
      this._x = val;
    } else {
      return this._x;
    }
  }
  y(val: number): void;
  y(): number;
  y(val?: number) {
    if (val !== undefined) {
      this._y = val;
    } else {
      return this._y;
    }
  }
  width(val: number): void;
  width(): number;
  width(val?: number) {
    if (val !== undefined) {
      this._width = val;
    } else {
      return this._width;
    }
  }
  height(val: number): void;
  height(): number;
  height(val?: number) {
    if (val !== undefined) {
      this._height = val;
    } else {
      return this._height;
    }
  }
  fill(val?: string) {
    if (val !== undefined) {
      this._fill = val;
    } else {
      return this._fill;
    }
  }
  getBBox(): IBox {
    // FIXME: 没考虑描边宽度
    return {
      x: this._x,
      y: this._y,
      width: this._width,
      height: this._height,
    };
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this._fill;
    // ctx.strokeStyle = this._stroke;
    ctx.fillRect(
      this.x(),
      this.y(),
      this.width(),
      this.height()
    );
  }
}
