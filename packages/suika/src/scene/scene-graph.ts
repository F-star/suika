import { Editor } from '../editor/editor';
import { IBox, IPoint, IRect } from '../type.interface';
import { drawCircle, rotateInCanvas } from '../utils/canvas';
import { genId } from '../utils/common';
import {
  arr2point,
  getAbsoluteCoords,
  getRectCenterPoint,
  getRectsBBox,
  isPointInCircle,
  isPointInRect,
  isRectContain,
  isRectIntersect,
} from '../utils/graphics';
import { transformRotate } from '../utils/transform';

/**
 * 图形树
 */
export class SceneGraph {
  // private map = new Map<string, any>();
  children: any[] = [];
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  handle: { rotation: IPoint } | null = null;

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
    const { viewport, canvasElement: canvas, ctx, setting } = this.editor;

    const visibleElements: any[] = [];
    // 1. 找出视口下所有元素
    // 暂时都认为是矩形
    for (let i = 0, len = this.children.length; i < len; i++) {
      const shape = this.children[i];
      if (isRectIntersect(shape.getBBox(), viewport)) {
        visibleElements.push(shape);
      }
    }
    // 2. 清空画布，然后绘制所有可见元素
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0, len = visibleElements.length; i < len; i++) {
      const element = visibleElements[i];
      if (element instanceof Rect) {
        ctx.fillStyle = element.fill;
        // ctx.strokeStyle = element._stroke;
        if (element.rotation) {
          const cx = element.x + element.width / 2;
          const cy = element.y + element.height / 2;
          ctx.save();
          rotateInCanvas(ctx, element.rotation, cx, cy);
        }
        ctx.fillRect(element.x, element.y, element.width, element.height);
        if (element.rotation) {
          ctx.restore();
        }
      }
    }
    // 3. 绘制 选中框
    this.highLightSelectedBox();

    // 绘制选区（使用选区工具时用到）
    if (this.selection) {
      ctx.save();
      ctx.strokeStyle = setting.selectionStroke;
      ctx.fillStyle = setting.selectionFill;
      const { x, y, width, height } = this.selection;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
    }

    // 绘制 “旋转” 控制点
    const handle = (this.handle = this.getTransformHandle());
    if (handle) {
      const { rotation } = handle;
      ctx.save();
      ctx.strokeStyle = setting.handleRotationStroke;
      ctx.fillStyle = setting.handleRotationFill;
      ctx.lineWidth = setting.handleRotationStrokeWidth;

      drawCircle(
        ctx,
        handle.rotation.x,
        handle.rotation.y,
        setting.handleRotationRadius
      );
      ctx.restore();
    }
  }
  /**
   * 光标是否落在旋转控制点上
   */
  isInRotationHandle(point: IPoint) {
    if (!this.handle) {
      return false;
    }
    // 计算旋转后的 x 和 y
    const rotationPoint = this.handle.rotation;

    return isPointInCircle(point, {
      x: rotationPoint.x,
      y: rotationPoint.y,
      radius: this.editor.setting.handleRotationRadius,
    });
  }
  private highLightSelectedBox() {
    // 1. 计算选中盒
    const selectedElements = this.editor.selectedElements.value;
    if (selectedElements.length === 0) {
      return;
    }
    const bBoxes = selectedElements.map((element) => element.getBBox());

    const ctx = this.editor.ctx;
    ctx.save();
    // 高亮元素轮廓
    for (let i = 0, len = bBoxes.length; i < len; i++) {
      ctx.save();
      const bBox = bBoxes[i];
      ctx.strokeStyle = this.editor.setting.guideBBoxStroke;
      const [cx, cy] = getRectCenterPoint(bBox);
      rotateInCanvas(ctx, selectedElements[i].rotation, cx, cy);
      ctx.strokeRect(bBox.x, bBox.y, bBox.width, bBox.height);
      ctx.restore();
    }

    // 只有单个选中元素，不绘制选中盒
    // 多个选中元素时，才绘制选中盒
    if (selectedElements.length > 1) {
      const bBoxesWithRotation = selectedElements.map((element) => element.getBBox({ withRotation: true }));
      const composedBBox = getRectsBBox(...bBoxesWithRotation);
      // 2. 高亮选中盒
      ctx.strokeStyle = this.editor.setting.guideBBoxStroke;
      ctx.strokeRect(
        composedBBox.x,
        composedBBox.y,
        composedBBox.width,
        composedBBox.height
      );
    }
    ctx.restore();
  }
  /**
   * 点是否在选中框中
   */
  isPointInSelectedBox(point: IPoint) {
    const selectedElements = this.editor.selectedElements.value;
    if (selectedElements.length === 0) {
      return false;
    }
    const bBoxes = selectedElements.map((element) => element.getBBox({ withRotation: true }));
    const composedBBox = getRectsBBox(...bBoxes);
    return isPointInRect(point, composedBBox);
  }
  getTopHitElement(hitPointer: IPoint): Rect | null {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const element: Rect = this.children[i];
      const bBox = element.getBBox();

      // "点击点" 根据图形进行 反旋转旋转
      const [cx, cy] = getRectCenterPoint(bBox);
      const rotatedHitPointer = element.rotation
        ? arr2point(
          transformRotate(
            hitPointer.x,
            hitPointer.y,
            -element.rotation,
            cx,
            cy
          )
        )
        : hitPointer;

      if (isPointInRect(rotatedHitPointer, bBox)) {
        return element;
      }
    }
    return null;
  }
  setSelection(partialRect: Partial<IRect>) {
    this.selection = Object.assign({}, this.selection, partialRect);
  }
  getElementsInSelection() {
    const selection = this.selection;
    if (selection === null) {
      console.warn('selection 为 null，请确认在正确的时机调用当前方法');
      return [];
    }

    const elements = this.children;
    const containedElements: Rect[] = [];
    for (let i = 0, len = elements.length; i < len; i++) {
      if (isRectContain(selection, elements[i].getBBox())) {
        containedElements.push(elements[i]);
      }
    }
    return containedElements;
  }
  getTransformHandle() {
    /**
     * rotation: 旋转方向为正北方向
     * ne 东北（西：west、北：north、东：east、西：west）
     * nw 西北
     * sw 西南 south west（左下）
     * se
     */
    // 1. 先考虑 “单个元素” 的 “旋转” 控制点
    const selectedElements = this.editor.selectedElements.value;
    if (selectedElements.length === 1) {
      const { x, y, width, height } = selectedElements[0];
      // 旋转位置
      let rotation = {
        x: x + width / 2,
        y: y - 14,
      };
      const [cx, cy] = this.editor.selectedElements.getCenterPoint();
      rotation = arr2point(
        transformRotate(
          rotation.x,
          rotation.y,
          this.editor.selectedElements.value[0].rotation,
          cx,
          cy
        )
      );
      return {
        rotation,
      };
    } else {
      return null;
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
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rotation = 0;
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
  /**
   * 计算包围盒（不考虑 strokeWidth）
   * 默认不考虑旋转，但可以通过 withRotation 开启
   */
  getBBox(options?: { withRotation: boolean } ): IBox {
    const withRotation = options ? options.withRotation : false; // 是否考虑旋转
    if (!withRotation || !this.rotation) {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      };
    }
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);
    const rotation = this.rotation;

    const [tlX, tlY] = transformRotate(x, y, rotation, cx, cy); // 左上
    const [trX, trY] = transformRotate(x2, y, rotation, cx, cy); // 右上
    const [brX, brY] = transformRotate(x2, y2, rotation, cx, cy); // 右下
    const [blX, blY] = transformRotate(x, y2, rotation, cx, cy); // 右下

    const minX = Math.min(tlX, trX, brX, blX);
    const minY = Math.min(tlY, trY, brY, blY);
    const maxX = Math.max(tlX, trX, brX, blX);
    const maxY = Math.max(tlY, trY, brY, blY);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.fill;
    // ctx.strokeStyle = this._stroke;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
