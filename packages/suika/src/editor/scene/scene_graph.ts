import { Editor } from '../editor';
import {
  GraphType,
  IBox,
  IEditorPaperData,
  IObject,
  IPoint,
  IRect,
} from '../../type';
import { rotateInCanvas } from '../../utils/canvas';
import EventEmitter from '../../utils/event_emitter';
import {
  getRectCenterPoint,
  getRectsBBox,
  isPointInRect,
  isRectIntersect,
} from '../../utils/graphics';
import rafThrottle from '../../utils/raf_throttle';
import { transformRotate } from '../../utils/transform';
import { Ellipse } from './ellipse';
import { Graph, GraphAttrs } from './graph';
import { Rect } from './rect';
import { TransformHandle } from './transform_handle';
import { arrMap, forEach } from '../../utils/array_util';
import Grid from '../grid';
import { getDevicePixelRatio } from '../../utils/common';
import { TextGraph } from './text';
import { Line } from './line';

const graphCtorMap = {
  [GraphType.Graph]: Graph,
  [GraphType.Rect]: Rect,
  [GraphType.Ellipse]: Ellipse,
  [GraphType.Line]: Line,
  [GraphType.Text]: TextGraph,
};

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

  addItems(element: Graph[], idx?: number) {
    if (idx === undefined) {
      this.children.push(...element);
    } else {
      this.children.splice(idx, 0, ...element);
    }
  }

  getItems() {
    return this.children;
  }

  getVisibleItems() {
    // TODO: cache if items are not changed
    return this.children.filter((item) => item.getVisible());
  }

  getElementById(id: string): Graph | undefined {
    return this.getElementsByIds(new Set([id]))[0];
  }

  getElementsByIds(ids: Set<string>) {
    return this.children.filter((item) => ids.has(item.id));
  }

  removeItems(elements: Graph[]) {
    if (elements.length > 1) {
      forEach(elements, (element) => {
        this.removeItems([element]);
      });
    } else {
      const element = elements[0];
      const idx = this.children.indexOf(element);
      if (idx !== -1) {
        this.children.splice(idx, 1);
      }
    }
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
    const viewportBoxInScene = this.editor.viewportManager.getBbox();

    const visibleGraphs = this.getVisibleItems();
    const visibleGraphsInViewport: Graph[] = [];
    // 1. 找出视口下所有元素
    // 暂时都认为是矩形
    for (const graph of visibleGraphs) {
      if (isRectIntersect(graph.getBBox(), viewportBoxInScene)) {
        visibleGraphsInViewport.push(graph);
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

    const dx = -viewport.x;
    const dy = -viewport.y;
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(dx, dy);

    const imgManager = this.editor.imgManager;
    for (let i = 0, len = visibleGraphsInViewport.length; i < len; i++) {
      ctx.save();
      const element = visibleGraphsInViewport[i];
      // 抗锯齿
      const smooth = zoom <= 1;
      element.draw(ctx, imgManager, smooth);
      ctx.restore();
    }

    /********** draw guide line *********/
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const selectedElementsBBox = this.editor.selectedElements.getBBox();

    /** draw pixel grid */
    if (
      setting.get('enablePixelGrid') &&
      zoom >= this.editor.setting.get('minPixelGridZoom')
    ) {
      this.grid.draw();
    }

    /** draw hover graph outline */
    if (setting.get('highlightLayersOnHover')) {
      const hoverGraph = this.editor.selectedElements.getHoverItem();
      if (
        hoverGraph &&
        hoverGraph.getVisible() &&
        !this.editor.selectedElements.hasItem(hoverGraph)
      ) {
        const strokeWidth = setting.get('hoverOutlineStrokeWidth');
        this.drawGraphsOutline([hoverGraph], { strokeWidth: strokeWidth });
      }
    }

    /** draw selected elements bbox */
    if (this.showOutline) {
      this.drawSelectedBox(selectedElementsBBox);
      this.drawGraphsOutline(
        this.editor.selectedElements
          .getItems()
          .filter((item) => item.getVisible()),
      );
    }

    /** draw selection */
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

    /** draw transform handle */
    if (this.showOutline) {
      this.transformHandle.draw(selectedElementsBBox);
    }

    this.editor.refLine.drawRefLine(ctx);

    /** drawing rulers */
    if (setting.get('enableRuler')) {
      this.editor.ruler.draw();
    }

    ctx.restore();

    this.eventEmitter.emit('render');
  });

  private drawGraphsOutline(
    graphs: Graph[],
    options?: { strokeWidth: number },
  ) {
    if (graphs.length === 0) {
      return;
    }

    const bBoxes = graphs.map((element) => element.getRect());
    const zoom = this.editor.zoomManager.getZoom();
    const ctx = this.editor.ctx;

    ctx.save();
    ctx.strokeStyle = this.editor.setting.get('guideBBoxStroke');
    if (options?.strokeWidth) {
      ctx.lineWidth = options.strokeWidth;
    }
    for (let i = 0, len = bBoxes.length; i < len; i++) {
      ctx.save();
      const bBox = bBoxes[i];
      const currElement = graphs[i];
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
    ctx.restore();
  }

  /**
   * 绘制每个元素的轮廓，以及包围它们的包围盒
   */
  private drawSelectedBox(selectedElementsBBox: IBox | null) {
    if (selectedElementsBBox === null) {
      return;
    }

    const zoom = this.editor.zoomManager.getZoom();
    const ctx = this.editor.ctx;

    ctx.save();
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
      bBoxes = selectedElements.map((element) => element.getRect());
      // 单个元素，要考虑旋转
      const element = selectedElements[0];
      const [cx, cy] = getRectCenterPoint(element);
      if (element.rotation) {
        point = transformRotate(point.x, point.y, -element.rotation, cx, cy);
      }
    }
    // 【多个元素被选中】
    else {
      bBoxes = selectedElements.map((element) => element.getBBox());
    }
    const composedBBox = getRectsBBox(...bBoxes);
    return isPointInRect(point, composedBBox);
  }
  getTopHitElement(x: number, y: number): Graph | null {
    const padding =
      this.editor.setting.get('selectionHitPadding') /
      this.editor.zoomManager.getZoom();

    let topHitElement: Graph | null = null;
    // TODO: optimize, use r-tree to reduce time complexity
    for (let i = this.children.length - 1; i >= 0; i--) {
      const el = this.children[i];
      if (el.getVisible() && el.hitTest(x, y, padding)) {
        topHitElement = el;
        break;
      }
    }
    return topHitElement;
  }
  setSelection(partialRect: Partial<IRect>) {
    this.selection = Object.assign({}, this.selection, partialRect);
  }
  /**
   * get elements in selection
   *
   * reference: https://mp.weixin.qq.com/s/u0PUOeTryZ11eM2P2Kxwsg
   */
  getElementsInSelection() {
    const selection = this.selection;
    if (selection === null) {
      console.warn('selection 为 null，请确认在正确的时机调用当前方法');
      return [];
    }

    const selectionMode = this.editor.setting.get('selectionMode');
    const elements = this.getVisibleItems();
    const containedElements: Graph[] = [];
    // TODO: optimize, use r-tree to reduce time complexity
    for (const el of elements) {
      let isSelected = false;
      if (selectionMode === 'contain') {
        isSelected = el.containWithRect(selection);
      } else {
        isSelected = el.intersectWithRect(selection);
      }
      if (isSelected) {
        containedElements.push(el);
      }
    }
    return containedElements;
  }

  /**
   * get tree data with simple info (for layer panel)
   */
  toObjects() {
    const graphs = this.children;
    const objects: IObject[] = [];

    const groupManager = this.editor.groupManager;
    const groupObjectMap = new Map<string, IObject & { children: IObject[] }>();

    forEach(graphs, (item) => {
      const obj = item.toObject();
      const groupIds = Array.from(groupManager.getGraphGroupIds(item.id));

      if (groupIds.length === 0) {
        objects.push(obj);
        return;
      }

      /**
       * create group object
       */
      let prevGroupObj: (IObject & { children: IObject[] }) | null = null;
      for (const groupId of groupIds) {
        const groupObj = groupObjectMap.get(groupId);

        if (!groupObj) {
          const group = groupManager.getGroup(groupId);
          if (!group) {
            throw new Error('group not found');
          }
          const groupObj = { ...group.toObject(), children: [] };
          groupObjectMap.set(groupId, groupObj);
          if (!prevGroupObj) {
            objects.push(groupObj);
          }
        }

        const currGroupObj = groupObjectMap.get(groupId)!;
        if (prevGroupObj && !prevGroupObj.children.includes(currGroupObj)) {
          prevGroupObj.children.push(currGroupObj);
        }
        prevGroupObj = currGroupObj;
      }

      prevGroupObj!.children.push(obj);
    });
    return objects;
  }

  toJSON() {
    const paperData: IEditorPaperData = {
      appVersion: 'suika-editor_0.0.1',
      paperId: this.editor.paperId,
      groups: this.editor.groupManager.export(),
      data: JSON.stringify(arrMap(this.children, (item) => item.toJSON())),
    };
    return JSON.stringify(paperData);
  }

  addGraphsByStr(str: string) {
    const data: GraphAttrs[] = JSON.parse(str);
    const newChildren = data.map((attrs) => {
      const type = attrs.type;
      const Ctor = graphCtorMap[type!];

      if (!Ctor) {
        throw new Error('found wrong type of graph');
      }

      return new Ctor(attrs as any);
    });

    this.children.push(...newChildren);
    return newChildren;
  }

  load(str: string) {
    this.children = [];
    this.addGraphsByStr(str);
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
