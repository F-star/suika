import {
  arrMap,
  EventEmitter,
  forEach,
  getDevicePixelRatio,
} from '@suika/common';
import { type IPoint, type IRect, isBoxIntersect, rectToBox } from '@suika/geo';

import { type Editor } from '../editor';
import {
  Ellipse,
  Graph,
  type GraphAttrs,
  Line,
  Path,
  Rect,
  TextGraph,
} from '../graphs';
import Grid from '../grid';
import { GraphType, type IEditorPaperData, type IObject } from '../type';
import { rafThrottle } from '../utils';

const graphCtorMap = {
  [GraphType.Graph]: Graph,
  [GraphType.Rect]: Rect,
  [GraphType.Ellipse]: Ellipse,
  [GraphType.Line]: Line,
  [GraphType.Text]: TextGraph,
  [GraphType.Path]: Path,
};

interface Events {
  render(): void;
}

export class SceneGraph {
  children: Graph[] = [];
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private eventEmitter = new EventEmitter<Events>();
  private grid: Grid;
  showBoxAndHandleWhenSelected = true;
  showSelectedGraphsOutline = true;
  highlightLayersOnHover = true;

  constructor(private editor: Editor) {
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
    return this.children.filter((item) => ids.has(item.attrs.id));
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
    const selectedElements = this.editor.selectedElements;

    const visibleGraphs = this.getVisibleItems();
    const visibleGraphsInViewport: Graph[] = [];
    // 1. 找出视口下所有元素
    // 暂时都认为是矩形
    for (const graph of visibleGraphs) {
      if (isBoxIntersect(graph.getBboxWithStroke(), viewportBoxInScene)) {
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

    /** draw pixel grid */
    if (
      setting.get('enablePixelGrid') &&
      zoom >= this.editor.setting.get('minPixelGridZoom')
    ) {
      this.grid.draw();
    }

    /** draw hover graph outline and its control handle */
    if (this.highlightLayersOnHover && setting.get('highlightLayersOnHover')) {
      const hlItem = selectedElements.getHighlightedItem();
      if (hlItem && !selectedElements.hasItem(hlItem)) {
        this.drawGraphsOutline(
          [hlItem],
          setting.get('hoverOutlineStrokeWidth'),
          this.editor.setting.get('hoverOutlineStroke'),
        );
      }
    }

    const selectedTransformBox = this.editor.selectedBox.updateBbox();

    /** draw selected elements outline */
    if (this.showSelectedGraphsOutline) {
      this.drawGraphsOutline(
        this.editor.selectedElements
          .getItems()
          .filter((item) => item.getVisible()),
        setting.get('selectedOutlineStrokeWidth'),
        this.editor.setting.get('hoverOutlineStroke'),
      );
      this.editor.selectedBox.draw();
    }

    // draw path editor path outline
    if (this.editor.pathEditor.isActive()) {
      const path = this.editor.pathEditor.getPath();
      if (path) {
        this.drawGraphsOutline(
          [path],
          setting.get('selectedOutlineStrokeWidth'),
          this.editor.setting.get('pathLineStroke'),
        );
      }
    }

    /** draw transform handle */
    if (this.showBoxAndHandleWhenSelected) {
      this.editor.controlHandleManager.draw(selectedTransformBox);
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
    strokeWidth: number,
    stroke: string,
  ) {
    const ctx = this.editor.ctx;
    const dpr = getDevicePixelRatio();
    const viewport = this.editor.viewportManager.getViewport();
    const zoom = this.editor.zoomManager.getZoom();
    const dx = -viewport.x;
    const dy = -viewport.y;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(dx, dy);

    strokeWidth /= zoom;
    for (const graph of graphs) {
      ctx.save();
      graph.drawOutline(ctx, stroke, strokeWidth);
      ctx.restore();
    }
    ctx.restore();
  }

  // private drawGraphsBbox(
  //   bBoxes: IRectWithRotation[],
  //   options?: { strokeWidth?: number; stroke?: string },
  // ) {
  //   if (bBoxes.length === 0) {
  //     return;
  //   }
  //
  //   const zoom = this.editor.zoomManager.getZoom();
  //   const ctx = this.editor.ctx;
  //   ctx.save();
  //   ctx.strokeStyle = this.editor.setting.get('guideBBoxStroke');
  //   if (options?.strokeWidth) {
  //     ctx.lineWidth = options.strokeWidth;
  //   }
  //   if (options?.stroke) {
  //     ctx.strokeStyle = options.stroke;
  //   }
  //
  //   for (let i = 0, len = bBoxes.length; i < len; i++) {
  //     ctx.save();
  //     const bBox = bBoxes[i];
  //     if (bBox.rotation) {
  //       const [cx, cy] = getRectCenterPoint(bBox);
  //       const { x: cxInViewport, y: cyInViewport } =
  //         this.editor.sceneCoordsToViewport(cx, cy);
  //       rotateInCanvas(ctx, bBox.rotation, cxInViewport, cyInViewport);
  //     }
  //     const { x: xInViewport, y: yInViewport } =
  //       this.editor.sceneCoordsToViewport(bBox.x, bBox.y);
  //     ctx.strokeRect(
  //       xInViewport,
  //       yInViewport,
  //       bBox.width * zoom,
  //       bBox.height * zoom,
  //     );
  //     ctx.restore();
  //   }
  //   ctx.restore();
  // }

  /** draw the mixed bounding box of selected elements */
  // private drawSelectedBox(bBox: IRectWithRotation) {
  //   const zoom = this.editor.zoomManager.getZoom();
  //   const ctx = this.editor.ctx;

  //   const stroke = this.editor.setting.get('guideBBoxStroke');

  //   ctx.save();
  //   ctx.strokeStyle = stroke;
  //   const { x: xInViewport, y: yInViewport } =
  //     this.editor.sceneCoordsToViewport(bBox.x, bBox.y);

  //   if (bBox.rotation) {
  //     const [cx, cy] = getRectCenterPoint(bBox);
  //     const { x: cxInViewport, y: cyInViewport } =
  //       this.editor.sceneCoordsToViewport(cx, cy);
  //     rotateInCanvas(ctx, bBox.rotation, cxInViewport, cyInViewport);
  //   }

  //   ctx.strokeRect(
  //     xInViewport,
  //     yInViewport,
  //     bBox.width * zoom,
  //     bBox.height * zoom,
  //   );

  //   ctx.restore();
  // }

  getTopHitElement(point: IPoint): Graph | null {
    const padding =
      this.editor.setting.get('selectionHitPadding') /
      this.editor.zoomManager.getZoom();

    let topHitElement: Graph | null = null;
    // TODO: optimize, use r-tree to reduce time complexity
    for (let i = this.children.length - 1; i >= 0; i--) {
      const el = this.children[i];
      if (
        el.getVisible() &&
        !el.getLock() &&
        el.hitTest(point.x, point.y, padding)
      ) {
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
    const selectionBox = rectToBox(selection);
    for (const el of elements) {
      if (el.getLock()) {
        continue;
      }
      let isSelected = false;
      if (selectionMode === 'contain') {
        isSelected = el.containWithBox(selectionBox);
      } else {
        isSelected = el.intersectWithBox(selectionBox);
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
      const groupIds = Array.from(groupManager.getGraphGroupIds(item.attrs.id));

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
    const data = arrMap(this.children, (item) => item.toJSON());
    const paperData: IEditorPaperData = {
      appVersion: 'suika-editor_0.0.1',
      paperId: this.editor.paperId,
      groups: this.editor.groupManager.export(),
      data: data,
    };
    return JSON.stringify(paperData);
  }

  addGraphsByStr(info: string | GraphAttrs[]) {
    const data: GraphAttrs[] =
      typeof info === 'string' ? JSON.parse(info) : info;

    const newChildren: Graph[] = [];
    for (const attrs of data) {
      const type = attrs.type;
      const Ctor = graphCtorMap[type!];
      if (!Ctor) {
        console.error(`Unsupported graph type "${attrs.type}", ignore it`);
        continue;
      }
      newChildren.push(new Ctor(attrs as any));
    }

    this.children.push(...newChildren);
    return newChildren;
  }

  load(info: string | GraphAttrs[]) {
    this.children = [];
    this.addGraphsByStr(info);
  }

  on(eventName: 'render', handler: () => void) {
    this.eventEmitter.on(eventName, handler);
  }
  off(eventName: 'render', handler: () => void) {
    this.eventEmitter.off(eventName, handler);
  }
}
