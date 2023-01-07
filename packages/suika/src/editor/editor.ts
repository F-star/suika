import hotkeys from 'hotkeys-js';
import { SceneGraph } from '../scene/scene-graph';
import { noop } from '../utils/common';
import { CommandManger } from './commands/commands';
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

  selectedElements: SelectedElements;

  isShiftPressing = false;
  isCtrlPressing = false;
  isCommandPressing = false;

  unbindScrollEventToZoom: () => void = noop;

  constructor(options: IEditorOptions) {
    this.canvasElement = options.canvasElement;
    this.ctx = this.canvasElement.getContext('2d')!;
    this.sceneGraph = new SceneGraph(this);

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

    this.bindHotkeys();
    this.bindWheelEventToZoom();
  }
  private bindHotkeys() {
    hotkeys('ctrl+z, command+z', { keydown: true }, () => {
      this.commandManger.undo();
    });
    hotkeys('ctrl+shift+z, command+shift+z', { keydown: true }, () => {
      this.commandManger.redo();
    });
    hotkeys('*', { keydown: true, keyup: true }, (event) => {
      if (hotkeys.shift) {
        if (event.type === 'keydown') {
          this.isShiftPressing = true;
        } else if (event.type === 'keyup') {
          this.isShiftPressing = false;
        }
      }
      if (hotkeys.ctrl) {
        if (event.type === 'keydown') {
          this.isCtrlPressing = true;
        } else if (event.type === 'keyup') {
          this.isCtrlPressing = false;
        }
      }
      if (hotkeys.command) {
        if (event.type === 'keydown') {
          this.isCommandPressing = true;
        } else if (event.type === 'keyup') {
          this.isCommandPressing = false;
        }
      }
    });
  }
  private bindWheelEventToZoom() {
    const handler = (event: WheelEvent) => {
      if (this.isCtrlPressing || this.isCommandPressing) {
        const cx = event.clientX;
        const cy = event.clientY;
        if (event.deltaY > 0) {
          this.zoomManager.zoomOut(cx, cy);
          this.sceneGraph.render();
        } else if (event.deltaY < 0) {
          this.zoomManager.zoomIn(cx, cy);
          this.sceneGraph.render();
        }
      }
    };
    this.canvasElement.addEventListener('wheel', handler);

    this.unbindScrollEventToZoom = () => {
      this.canvasElement.removeEventListener('wheel', handler);
    };
  }
  destroy() {
    this.toolManager.unbindEvent();
    hotkeys.unbind();
    this.unbindScrollEventToZoom();
  }
  /**
   * 视口坐标 转 场景坐标
   */
  viewportCoordsToSceneCoords(x: number, y: number) {
    const zoom = this.zoomManager.getZoom();
    const { x: scrollX, y: scrollY } = this.viewportManager.getViewport();
    return {
      x: scrollX + x / zoom,
      y: scrollY + y / zoom,
    };
  }
  sceneCoordsToViewport(x: number, y: number) {
    const zoom = this.zoomManager.getZoom();
    const { x: scrollX, y: scrollY } = this.viewportManager.getViewport();
    return {
      x: (x - scrollX) * zoom,
      y: (y - scrollY) * zoom,
    };
  }
}
