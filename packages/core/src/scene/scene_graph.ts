import { EventEmitter, forEach, getDevicePixelRatio } from '@suika/common';
import { type IPoint, type IRect, rectToBox } from '@suika/geo';

import { type Editor } from '../editor';
import {
  type GraphicsAttrs,
  SuikaEllipse,
  SuikaFrame,
  SuikaGraphics,
  SuikaLine,
  SuikaPath,
  SuikaRect,
  SuikaText,
} from '../graphs';
import { SuikaCanvas } from '../graphs/canvas';
import { SuikaDocument } from '../graphs/document';
import { SuikaRegularPolygon } from '../graphs/regular_polygon';
import { SuikaStar } from '../graphs/star';
import Grid from '../grid';
import { GraphicsType, type IEditorPaperData } from '../type';
import { rafThrottle } from '../utils';

const graphCtorMap = {
  [GraphicsType.Graph]: SuikaGraphics,
  [GraphicsType.Rect]: SuikaRect,
  [GraphicsType.Ellipse]: SuikaEllipse,
  [GraphicsType.Line]: SuikaLine,
  [GraphicsType.Text]: SuikaText,
  [GraphicsType.Path]: SuikaPath,
  [GraphicsType.RegularPolygon]: SuikaRegularPolygon,
  [GraphicsType.Star]: SuikaStar,
  [GraphicsType.Frame]: SuikaFrame,
  [GraphicsType.Canvas]: SuikaCanvas,
  [GraphicsType.Document]: SuikaDocument,
};

interface Events {
  render(): void;
}

export class SceneGraph {
  children: SuikaGraphics[] = [];
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

  addItems(graphicsArr: SuikaGraphics[]) {
    this.children.push(...graphicsArr);

    for (const graph of graphicsArr) {
      this.editor.doc.graphicsStore.add(graph);
    }
  }

  getItems() {
    return this.children;
  }

  /** @deprecated */
  getVisibleItems() {
    // TODO: cache if items are not changed
    return this.children.filter((item) => item.isVisible());
  }

  getElementById(id: string): SuikaGraphics | undefined {
    return this.getElementsByIds(new Set([id]))[0];
  }

  getElementsByIds(ids: Set<string>) {
    return this.children.filter((item) => ids.has(item.attrs.id));
  }

  removeItems(elements: SuikaGraphics[]) {
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
    const selectedElements = this.editor.selectedElements;

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

    const canvasGraphics = this.editor.doc.graphicsStore.getCanvas();
    if (canvasGraphics) {
      const smooth = zoom <= 1;
      ctx.save();
      canvasGraphics.draw(ctx, imgManager, smooth);
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
          .filter((item) => item.isVisible()),
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
    graphs: SuikaGraphics[],
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

  /**
   * @deprecated
   */
  getTopHitElement(point: IPoint): SuikaGraphics | null {
    const padding =
      this.editor.setting.get('selectionHitPadding') /
      this.editor.zoomManager.getZoom();

    let topHitElement: SuikaGraphics | null = null;
    const parentIdSet = this.editor.selectedElements.getParentIdSet();

    // TODO: optimize, use r-tree to reduce time complexity
    for (let i = this.children.length - 1; i >= 0; i--) {
      const el = this.children[i];
      if (
        el.isVisible() &&
        !el.isLock() &&
        el.hitTest(point.x, point.y, padding) &&
        // parent of select graphics can't be hovered
        !parentIdSet.has(el.attrs.id)
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
    const containedElements: SuikaGraphics[] = [];
    // TODO: to optimize, use r-tree to reduce time complexity
    const selectionBox = rectToBox(selection);
    for (const el of elements) {
      if (el.isLock() || el instanceof SuikaCanvas) {
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
    const canvasGraphics = this.editor.doc.graphicsStore.getCanvas();
    if (!canvasGraphics) {
      return [];
    }
    return canvasGraphics.toObject().children ?? [];
  }

  toJSON() {
    const data = this.children
      .filter((graphics) => !graphics.isDeleted())
      .map((item) => item.toJSON());
    const paperData: IEditorPaperData = {
      appVersion: this.editor.appVersion,
      paperId: this.editor.paperId,
      data: data,
    };
    return JSON.stringify(paperData);
  }

  createGraphicsArr(data: GraphicsAttrs[]) {
    const children: SuikaGraphics[] = [];
    for (const attrs of data) {
      const type = attrs.type;
      const Ctor = graphCtorMap[type!];
      if (!Ctor) {
        console.error(`Unsupported graph type "${attrs.type}", ignore it`);
        continue;
      }
      children.push(new Ctor(attrs as any, { doc: this.editor.doc }));
    }
    return children;
  }

  initGraphicsTree(graphicsArr: SuikaGraphics[]) {
    const canvasGraphics = this.editor.doc.graphicsStore.getCanvas();
    for (const graphics of graphicsArr) {
      const parent = graphics.getParent() ?? canvasGraphics;
      if (parent && parent !== graphics) {
        parent.insertChild(graphics, graphics.attrs.parentIndex?.position);
      }
    }
  }

  load(info: GraphicsAttrs[]) {
    this.children = [];
    const graphicsArr = this.createGraphicsArr(info);
    this.addItems(graphicsArr);
    this.initGraphicsTree(graphicsArr);
  }

  on(eventName: 'render', handler: () => void) {
    this.eventEmitter.on(eventName, handler);
  }
  off(eventName: 'render', handler: () => void) {
    this.eventEmitter.off(eventName, handler);
  }
}
