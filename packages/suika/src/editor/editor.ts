import hotkeys from 'hotkeys-js';
import { SceneGraph } from '../scene/scene-graph';
import { IBox } from '../type.interface';
import { CommandManger } from './commands/commands';
import SelectedElements from './selected_elements';
import { Setting } from './setting';
import { ToolManager } from './tools/tool_manager';

interface IEditorOptions {
  canvasElement: HTMLCanvasElement;
}

export class Editor {
  canvasElement: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  sceneGraph: SceneGraph;

  setting: Setting;

  viewport!: IBox;

  toolManager: ToolManager;
  commandManger: CommandManger;

  selectedElements: SelectedElements;

  isShiftPressing = false;

  constructor(options: IEditorOptions) {
    this.canvasElement = options.canvasElement;
    this.ctx = this.canvasElement.getContext('2d')!;
    this.sceneGraph = new SceneGraph(this);

    this.setting = new Setting();

    this.toolManager = new ToolManager(this);
    this.commandManger = new CommandManger(this);

    this.selectedElements = new SelectedElements();

    // 设置视口
    this.setViewport({
      x: 0,
      y: 0,
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    });
  }
  setViewport(box: IBox) {
    this.viewport = { ...box };
  }
  bindHotkeys() {
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
    });
  }
  destroy() {
    this.toolManager.unbindEvent();
    hotkeys.unbind();
  }
}
