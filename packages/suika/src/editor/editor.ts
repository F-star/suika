import { SceneGraph } from '../scene/scene-graph';
import { sceneCoordsToViewportUtil, viewportCoordsToSceneUtil } from '../utils/common';
import { CommandManger } from './commands/commands';
import HotkeysManager from './hotkeys_manager';
import SelectedElements from './selected_elements';
import { Setting } from './setting';
import { ToolManager } from './tools/tool_manager';
import { ViewportManager } from './viewport_manager';
import { ZoomManager } from './zoom_manager';

interface IEditorOptions {
  canvasElement: HTMLCanvasElement;
}

export class Editor {
  canvasElement: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  sceneGraph: SceneGraph;

  setting: Setting;

  viewportManager: ViewportManager;

  toolManager: ToolManager;
  commandManger: CommandManger;
  zoomManager: ZoomManager;

  hotkeysManager: HotkeysManager;

  selectedElements: SelectedElements;

  constructor(options: IEditorOptions) {
    this.canvasElement = options.canvasElement;
    this.ctx = this.canvasElement.getContext('2d')!;
    this.sceneGraph = new SceneGraph(this);

    this.hotkeysManager = new HotkeysManager(this);
    this.hotkeysManager.bindHotkeys();

    this.setting = new Setting();

    this.viewportManager = new ViewportManager(this);

    this.toolManager = new ToolManager(this);
    this.commandManger = new CommandManger(this);
    this.zoomManager = new ZoomManager(this);

    this.selectedElements = new SelectedElements();

    // 设置视口
    this.viewportManager.setViewport({
      x: 0,
      y: 0,
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    });
    /**
     * setViewport 其实会修改 canvas 的宽高，浏览器的 DOM 更新是异步的，
     * 所以下面的 render 要异步执行
     */
    Promise.resolve().then(() => {
      this.sceneGraph.render();
    });
  }
  destroy() {
    this.hotkeysManager.destroy();
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
  viewportCoordsToScene(x: number, y: number) {
    const zoom = this.zoomManager.getZoom();
    const { x: scrollX, y: scrollY } = this.viewportManager.getViewport();
    return viewportCoordsToSceneUtil(x, y, zoom, scrollX, scrollY);
  }
  sceneCoordsToViewport(x: number, y: number) {
    const zoom = this.zoomManager.getZoom();
    const { x: scrollX, y: scrollY } = this.viewportManager.getViewport();
    return sceneCoordsToViewportUtil(x, y, zoom, scrollX, scrollY);
  }
}
