import { SceneGraph } from './scene/scene_graph';
import {
  sceneCoordsToViewportUtil,
  viewportCoordsToSceneUtil,
} from '../utils/common';
import { CommandManager } from './commands/command_manager';
import HostEventManager from './host_event_manager';
import Ruler from './ruler';
import SelectedElements from './selected_elements';
import { Setting } from './setting';
import { ToolManager } from './tools/tool_manager';
import { ViewportManager } from './viewport_manager';
import { ZoomManager } from './zoom_manager';
import { AutoSaveGraphs } from './store/auto-save-graphs';
import { GraphAttrs } from './scene/graph';
import { TextEditor } from './text/text_editor';

interface IEditorOptions {
  containerElement: HTMLDivElement;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}

export class Editor {
  containerElement: HTMLDivElement;
  canvasElement: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  sceneGraph: SceneGraph;

  setting: Setting;

  viewportManager: ViewportManager;

  toolManager: ToolManager;
  commandManager: CommandManager;
  zoomManager: ZoomManager;

  hostEventManager: HostEventManager;

  selectedElements: SelectedElements;
  ruler: Ruler;
  textEditor: TextEditor;

  autoSaveGraphs: AutoSaveGraphs;

  constructor(options: IEditorOptions) {
    this.containerElement = options.containerElement;
    this.canvasElement = document.createElement('canvas');
    this.containerElement.appendChild(this.canvasElement);
    this.ctx = this.canvasElement.getContext('2d')!;

    this.setting = new Setting();
    if (options.offsetX) {
      this.setting.set('offsetX', options.offsetX);
    }
    if (options.offsetY) {
      this.setting.set('offsetY', options.offsetY);
    }

    this.sceneGraph = new SceneGraph(this);

    this.viewportManager = new ViewportManager(this);

    this.toolManager = new ToolManager(this);
    this.commandManager = new CommandManager(this);
    this.zoomManager = new ZoomManager(this);

    this.selectedElements = new SelectedElements(this);
    this.ruler = new Ruler(this);
    this.textEditor = new TextEditor(this);

    this.hostEventManager = new HostEventManager(this);
    this.hostEventManager.bindHotkeys();

    this.autoSaveGraphs = new AutoSaveGraphs(this);
    this.autoSaveGraphs.load();
    this.autoSaveGraphs.autoSave();

    // 设置初始视口
    this.viewportManager.setViewport({
      x: -options.width / 2,
      y: -options.height / 2,
      width: options.width,
      height: options.height,
    });

    this.zoomManager.zoomToFit();

    /**
     * setViewport 其实会修改 canvas 的宽高，浏览器的 DOM 更新是异步的，
     * 所以下面的 render 要异步执行
     */
    Promise.resolve().then(() => {
      this.sceneGraph.render();
    });
  }
  destroy() {
    this.containerElement.removeChild(this.canvasElement);
    this.textEditor.destroy();
    this.hostEventManager.destroy();
    this.toolManager.unbindEvent();
    this.toolManager.destroy();
  }
  setCursor(cursor: string) {
    this.canvasElement.style.cursor = cursor;
  }
  getCursor() {
    return this.canvasElement.style.cursor;
  }
  /**
   * 视口坐标 转 场景坐标
   */
  viewportCoordsToScene(x: number, y: number, round = false) {
    const zoom = this.zoomManager.getZoom();
    const { x: scrollX, y: scrollY } = this.viewportManager.getViewport();
    return viewportCoordsToSceneUtil(x, y, zoom, scrollX, scrollY, round);
  }
  sceneCoordsToViewport(x: number, y: number) {
    const zoom = this.zoomManager.getZoom();
    const { x: scrollX, y: scrollY } = this.viewportManager.getViewport();
    return sceneCoordsToViewportUtil(x, y, zoom, scrollX, scrollY);
  }
  getCursorXY(event: PointerEvent | WheelEvent) {
    return {
      x: event.clientX - this.setting.get('offsetX'),
      y: event.clientY - this.setting.get('offsetY'),
    };
  }
  getSceneCursorXY(event: PointerEvent | WheelEvent, round = false) {
    const { x, y } = this.getCursorXY(event);
    return this.viewportCoordsToScene(x, y, round);
  }
  moveElements(elements: GraphAttrs[], dx: number, dy: number) {
    for (const element of elements) {
      element.x += dx;
      element.y += dy;
    }
  }
}
