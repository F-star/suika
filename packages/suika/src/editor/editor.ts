import { SceneGraph } from '../scene-graph';
import { IBox } from '../type.interface';
import { CommandManger } from './commands';
import { Setting } from './setting';
import { ToolManager } from './tools/toolManager';

interface IEditorOptions {
  canvasElement: HTMLCanvasElement
}

export class Editor {
  canvasElement: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  sceneGraph: SceneGraph;

  setting: Setting;

  viewport!: IBox;

  toolManage: ToolManager;
  commandManger: CommandManger;

  constructor(options: IEditorOptions) {
    this.canvasElement = options.canvasElement;
    this.ctx = this.canvasElement.getContext('2d')!;
    this.sceneGraph = new SceneGraph(this);

    this.setting = new Setting();

    this.toolManage = new ToolManager(this);
    this.commandManger = new CommandManger(this.sceneGraph);

    // 设置视口
    this.setViewport({ x: 0, y: 0, width: document.body.clientWidth, height: document.body.clientHeight });
  }
  setViewport(box: IBox) {
    this.viewport = { ...box };
  }
  destroy() {
    this.toolManage.unbindEvent();
  }
}