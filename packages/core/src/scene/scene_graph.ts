import { EventEmitter, getDevicePixelRatio } from '@suika/common';
import { type IRect } from '@suika/geo';

import { type SuikaEditor } from '../editor';
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

  constructor(private editor: SuikaEditor) {
    this.grid = new Grid(editor);
  }

  addItems(graphicsArr: SuikaGraphics[]) {
    for (const graph of graphicsArr) {
      this.editor.doc.addGraphics(graph);
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

    const canvasGraphics = this.editor.doc.getCanvas();
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

  setSelection(partialRect: Partial<IRect>) {
    this.selection = Object.assign({}, this.selection, partialRect);
  }

  /**
   * get tree data with simple info (for layer panel)
   */
  toObjects() {
    const canvasGraphics = this.editor.doc.getCanvas();
    if (!canvasGraphics) {
      return [];
    }
    return canvasGraphics.toObject().children ?? [];
  }

  toJSON() {
    const data = this.editor.doc
      .getAllGraphicsArr()
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
    const canvasGraphics = this.editor.doc.getCanvas();
    for (const graphics of graphicsArr) {
      if (graphics instanceof SuikaCanvas) {
        continue;
      }
      const parent = graphics.getParent() ?? canvasGraphics;
      if (parent && parent !== graphics) {
        parent.insertChild(graphics, graphics.attrs.parentIndex?.position);
      }
    }
  }

  load(info: GraphicsAttrs[], isApplyChanges?: boolean) {
    const graphicsArr = this.createGraphicsArr(info);
    if (!isApplyChanges) {
      this.editor.doc.clear();
    }
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
