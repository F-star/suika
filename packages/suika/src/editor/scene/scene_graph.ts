import { Editor } from '../editor';
import { GraphType, IBox, IObject, IPoint, IRect } from '../../type.interface';
import { rotateInCanvas } from '../../utils/canvas';
import EventEmitter from '../../utils/event_emitter';
import {
  arr2point,
  getRectCenterPoint,
  getRectsBBox,
  isPointInRect,
  isRectContain,
  isRectIntersect,
} from '../../utils/graphics';
import rafThrottle from '../../utils/raf_throttle';
import { transformRotate } from '../../utils/transform';
import { Ellipse } from './ellipse';
import { Graph, IGraph } from './graph';
import { Rect } from './rect';
import { TransformHandle } from './transform_handle';
import { forEach } from '../../utils/array_util';
import Grid from '../grid';
import { getDevicePixelRatio } from '../../utils/common';

interface Events {
  render(): void;
}

/**
 * 图形树
 */
export class SceneGraph {
  children: Graph[] = [];
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  // private handle: { rotation: IPoint } | null = null;
  private eventEmitter = new EventEmitter<Events>();
  transformHandle: TransformHandle;
  grid: Grid;
  showOutline = true;

  constructor(private editor: Editor) {
    this.transformHandle = new TransformHandle(editor);
    this.grid = new Grid(editor);
  }
  appendChild(element: Graph, idx?: number) {
    if (idx === undefined) {
      this.children.push(element);
    } else {
      this.children.splice(idx, 0, element);
    }
  }
  getElementById(id: string) {
    return this.children.find((item) => item.id === id);
  }
  removeChild(element: Graph) {
    const idx = this.children.indexOf(element);
    if (idx !== -1) {
      this.children.splice(idx, 1);
    }
    return idx;
  }
  // 全局重渲染
  render = rafThrottle(() => {
    // 获取视口区域
    const {
      viewportManager,
      canvasElement: canvas,
      ctx,
      setting,
    } = this.editor;
    const viewport = viewportManager.getViewport();
    const zoom = this.editor.zoomManager.getZoom();
    const viewportBoxInScene = {
      // TODO: 考虑外扩一个 padding
      x: viewport.x,
      y: viewport.y,
      width: viewport.width / zoom,
      height: viewport.height / zoom,
    };

    const visibleElements: Graph[] = [];
    // 1. 找出视口下所有元素
    // 暂时都认为是矩形
    for (let i = 0, len = this.children.length; i < len; i++) {
      const shape = this.children[i];

      if (isRectIntersect(shape.getBBox(), viewportBoxInScene)) {
        visibleElements.push(shape);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 2. 清空画布，然后绘制所有可见元素
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景色
    ctx.save();
    ctx.fillStyle = setting.get('canvasBgColor');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 场景坐标转换为视口坐标
    const dpr = getDevicePixelRatio();

    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(-viewport.x, -viewport.y);

    for (let i = 0, len = visibleElements.length; i < len; i++) {
      ctx.save();
      const element = visibleElements[i];
      element.fillTexture(ctx);
      ctx.restore();
    }

    /******************* 绘制辅助线层 ********************/
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const selectedElementsBBox = this.editor.selectedElements.getBBox();

    // 1. draw pixel grid
    if (
      setting.get('enablePixelGrid') &&
      zoom >= this.editor.setting.get('minPixelGridZoom')
    ) {
      this.grid.draw();
    }

    // 2. draw selected elements bbox
    if (this.showOutline) {
      this.highLightSelectedBox(selectedElementsBBox);
    }

    // 3. draw selectionBox
    if (this.selection) {
      ctx.save();
      ctx.strokeStyle = setting.get('selectionStroke');
      ctx.fillStyle = setting.get('selectionFill');
      const { x, y, width, height } = this.selection;

      const { x: xInViewport, y: yInViewport } =
        this.editor.sceneCoordsToViewport(x, y);

      const widthInViewport = width * zoom;
      const heightInViewport = height * zoom;

      ctx.fillRect(xInViewport, yInViewport, widthInViewport, heightInViewport);
      ctx.strokeRect(
        xInViewport,
        yInViewport,
        widthInViewport,
        heightInViewport,
      );
      ctx.restore();
    }

    // 4. draw transform handle
    if (this.showOutline) {
      this.transformHandle.draw(selectedElementsBBox);
    }

    // 5. drawing rulers
    if (setting.get('enableRuler')) {
      this.editor.ruler.draw();
    }

    ctx.restore();

    this.eventEmitter.emit('render');
  });
  /**
   * 光标是否落在旋转控制点上
   */

  /**
   * 绘制每个元素的轮廓，以及包围它们的包围盒
   */
  private highLightSelectedBox(selectedElementsBBox: IBox | null) {
    /******* 绘制每个元素的包围盒（FIXME: 改为绘制轮廓） *******/
    if (selectedElementsBBox === null) {
      return;
    }
    const selectedElements = this.editor.selectedElements.getItems();

    const bBoxes = selectedElements.map((element) =>
      element.getBBoxWithoutRotation(),
    );

    const zoom = this.editor.zoomManager.getZoom();
    const ctx = this.editor.ctx;

    ctx.save();
    // TODO: 椭圆图形，要绘制圆形轮廓
    for (let i = 0, len = bBoxes.length; i < len; i++) {
      ctx.save();
      const bBox = bBoxes[i];
      ctx.strokeStyle = this.editor.setting.get('guideBBoxStroke');

      const currElement = selectedElements[i];
      if (currElement.rotation) {
        const [cx, cy] = getRectCenterPoint(bBox);
        const { x: cxInViewport, y: cyInViewport } =
          this.editor.sceneCoordsToViewport(cx, cy);
        rotateInCanvas(ctx, currElement.rotation, cxInViewport, cyInViewport);
      }
      const { x: xInViewport, y: yInViewport } =
        this.editor.sceneCoordsToViewport(bBox.x, bBox.y);
      ctx.strokeRect(
        xInViewport,
        yInViewport,
        bBox.width * zoom,
        bBox.height * zoom,
      );
      ctx.restore();
    }

    /********** 绘制多个图形组成的包围盒 *********/
    // 只有单个选中元素，不绘制选中盒

    // 多个选中元素时，才绘制选中盒
    if (selectedElements.length > 1) {
      ctx.strokeStyle = this.editor.setting.get('guideBBoxStroke');
      const { x: xInViewport, y: yInViewport } =
        this.editor.sceneCoordsToViewport(
          selectedElementsBBox.x,
          selectedElementsBBox.y,
        );
      ctx.strokeRect(
        xInViewport,
        yInViewport,
        selectedElementsBBox.width * zoom,
        selectedElementsBBox.height * zoom,
      );
    }
    ctx.restore();
  }
  /**
   * 点是否在选中框（selectedBox）中
   */
  isPointInSelectedBox(point: IPoint) {
    const selectedElements = this.editor.selectedElements.getItems();
    if (selectedElements.length === 0) {
      return false;
    }

    let bBoxes: IBox[];
    // 【单个元素被选中】求不考虑旋转的 bBox，将其和旋转后的角度比较
    if (selectedElements.length === 1) {
      bBoxes = selectedElements.map((element) =>
        element.getBBoxWithoutRotation(),
      );
      // 单个元素，要考虑旋转
      const element = selectedElements[0];
      const [cx, cy] = getRectCenterPoint(element);
      if (element.rotation) {
        point = arr2point(
          transformRotate(point.x, point.y, -element.rotation, cx, cy),
        );
      }
    }
    // 【多个元素被选中】
    else {
      bBoxes = selectedElements.map((element) => element.getBBox());
    }
    const composedBBox = getRectsBBox(...bBoxes);
    return isPointInRect(point, composedBBox);
  }
  getTopHitElement(hitPointer: IPoint): Rect | null {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const element: Rect = this.children[i];
      const bBox = element.getBBoxWithoutRotation();

      // "点击点" 根据图形进行 反旋转旋转
      const [cx, cy] = getRectCenterPoint(bBox);
      const rotatedHitPointer = element.rotation
        ? arr2point(
            transformRotate(
              hitPointer.x,
              hitPointer.y,
              -element.rotation,
              cx,
              cy,
            ),
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
    const containedElements: Graph[] = [];
    for (let i = 0, len = elements.length; i < len; i++) {
      if (isRectContain(selection, elements[i].getBBox())) {
        containedElements.push(elements[i]);
      }
    }
    return containedElements;
  }

  /**
   * get simple info (for layer panel)
   */
  getObjects() {
    const children = this.children;
    const objects: IObject[] = [];
    forEach(children, (item) => {
      objects.push({ id: item.id, name: item.objectName });
    });
    return objects;
  }

  toJSON() {
    return JSON.stringify(this.children);
  }

  load(str: string) {
    const ctorMap = {
      [GraphType.Graph]: Graph,
      [GraphType.Rect]: Rect,
      [GraphType.Ellipse]: Ellipse,
    };

    const data: IGraph[] = JSON.parse(str);
    // TODO: check valid
    this.children = data.map((attrs) => {
      const type = attrs.type;
      const Ctor = ctorMap[type!];

      if (!Ctor) {
        throw new Error('found wrong type of graph');
      }

      return new Ctor(attrs);
    });
  }

  // TODO: update tree by patch obj and id
  updateElements() {
    /**
     * {
     *   update: { id: '123', attrs: { width: 1 }  }
     *   removed: new Set(['8', '9'])
     *   create: { type: rect, }
     * }
     */
  }

  on(eventName: 'render', handler: () => void) {
    this.eventEmitter.on(eventName, handler);
  }
  off(eventName: 'render', handler: () => void) {
    this.eventEmitter.off(eventName, handler);
  }
}
