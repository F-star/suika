import { EventEmitter, genUuid } from '@suika/common';
import { mergeBoxes } from '@suika/geo';

import { CanvasDragger } from './canvas_dragger';
import { ClipboardManager } from './clipboard';
import { CommandManager } from './commands/command_manager';
import { ControlHandleManager } from './control_handle_manager';
import { CursorManger, type ICursor } from './cursor_manager';
import { type GraphicsAttrs, SuikaCanvas } from './graphics';
import { SuikaDocument } from './graphics/document';
import { HostEventManager, MouseEventManager } from './host_event_manager';
import { ImgManager } from './Img_manager';
import { KeyBindingManager } from './key_binding_manager';
import { PathEditor } from './path_editor';
import { PerfMonitor } from './perf_monitor';
import { RefLine } from './ref_line';
import { Ruler } from './ruler';
import { SceneGraph } from './scene/scene_graph';
import { SelectedBox } from './selected_box';
import { SelectedElements } from './selected_elements';
import { Setting, type SettingValue } from './setting';
import { TextEditor } from './text/text_editor';
import { ToolManager } from './tools';
import { type IChanges, type IEditorPaperData } from './type';
import { ViewportManager } from './viewport_manager';

interface IEditorOptions {
  containerElement: HTMLDivElement;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
  showPerfMonitor?: boolean;
  userPreference?: Partial<SettingValue>;
}

interface Events {
  destroy(): void;
}

export class SuikaEditor {
  containerElement: HTMLDivElement;
  canvasElement: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  appVersion = 'suika-editor_0.0.3';
  paperId: string;

  private emitter = new EventEmitter<Events>();

  doc: SuikaDocument;
  sceneGraph: SceneGraph;
  controlHandleManager: ControlHandleManager;

  setting: Setting;

  viewportManager: ViewportManager;

  canvasDragger: CanvasDragger;
  toolManager: ToolManager;
  commandManager: CommandManager;
  imgManager: ImgManager;

  cursorManager: CursorManger;
  mouseEventManager: MouseEventManager;
  keybindingManager: KeyBindingManager;
  hostEventManager: HostEventManager;
  clipboard: ClipboardManager;

  selectedElements: SelectedElements;
  selectedBox: SelectedBox;
  ruler: Ruler;
  refLine: RefLine;
  textEditor: TextEditor;
  pathEditor: PathEditor;

  perfMonitor: PerfMonitor;

  constructor(options: IEditorOptions) {
    this.containerElement = options.containerElement;
    this.canvasElement = document.createElement('canvas');
    this.containerElement.appendChild(this.canvasElement);
    this.ctx = this.canvasElement.getContext('2d')!;

    this.setting = new Setting(options.userPreference);
    if (options.offsetX) {
      this.setting.set('offsetX', options.offsetX);
    }
    if (options.offsetY) {
      this.setting.set('offsetY', options.offsetY);
    }

    this.mouseEventManager = new MouseEventManager(this);
    this.keybindingManager = new KeyBindingManager(this);
    this.keybindingManager.bindEvent();

    this.sceneGraph = new SceneGraph(this);

    this.cursorManager = new CursorManger(this);
    this.viewportManager = new ViewportManager(this);

    this.commandManager = new CommandManager(this);
    this.imgManager = new ImgManager();

    this.selectedElements = new SelectedElements(this);
    this.selectedBox = new SelectedBox(this);
    this.ruler = new Ruler(this);
    this.refLine = new RefLine(this);

    this.controlHandleManager = new ControlHandleManager(this);
    this.controlHandleManager.bindEvents();

    this.textEditor = new TextEditor(this);
    this.pathEditor = new PathEditor(this);

    this.hostEventManager = new HostEventManager(this);
    this.hostEventManager.bindHotkeys();

    this.canvasDragger = new CanvasDragger(this);
    this.toolManager = new ToolManager(this);

    this.clipboard = new ClipboardManager(this);
    this.clipboard.bindEvents();

    this.imgManager.on('added', () => {
      this.render();
    });

    this.paperId = genUuid();

    this.doc = new SuikaDocument({
      id: '0-0',
      objectName: 'Document',
      width: 0,
      height: 0,
    });
    this.doc.setEditor(this);

    const canvas = new SuikaCanvas(
      {
        objectName: 'Page 1',
      },
      {
        doc: this.doc,
      },
    );
    this.sceneGraph.addItems([this.doc, canvas]);
    this.doc.insertChild(canvas);

    this.viewportManager.setViewportSize({
      width: options.width,
      height: options.height,
    });

    this.doc.setCurrentCanvas(canvas.attrs.id);

    this.perfMonitor = new PerfMonitor();
    if (options.showPerfMonitor) {
      this.perfMonitor.start(this.containerElement);
    }

    /**
     * setViewport 其实会修改 canvas 的宽高，浏览器的 DOM 更新是异步的，
     * 所以下面的 render 要异步执行
     */
    Promise.resolve().then(() => {
      this.render();
    });
  }

  setContents(data: IEditorPaperData) {
    this.sceneGraph.load(data.data);
    this.commandManager.clearRecords();
    this.paperId = data.paperId ?? genUuid();

    const firstCanvas = this.doc.getChildren()[0];
    this.doc.setCurrentCanvas(firstCanvas.attrs.id);

    if (!this.doc.getChildren().length) {
      const canvas = new SuikaCanvas(
        {
          objectName: 'Page 1',
        },
        {
          doc: this.doc,
        },
      );
      this.sceneGraph.addItems([canvas]);
      this.doc.insertChild(canvas);
      this.doc.setCurrentCanvas(canvas.attrs.id);
    }

    this.viewportManager.zoomToFit(1);
  }

  destroy() {
    this.containerElement.removeChild(this.canvasElement);
    this.textEditor.destroy();
    this.keybindingManager.destroy();
    this.hostEventManager.destroy();
    this.clipboard.destroy();
    this.canvasDragger.destroy();
    this.toolManager.unbindEvent();
    this.toolManager.destroy();
    this.perfMonitor.destroy();
    this.controlHandleManager.unbindEvents();
    this.emitter.emit('destroy');
  }
  setCursor(cursor: ICursor) {
    this.cursorManager.setCursor(cursor);
  }
  getCursor() {
    return this.cursorManager.getCursor();
  }

  toScenePt(x: number, y: number, round = false) {
    return this.viewportManager.toScenePt(x, y, round);
  }
  toViewportPt(x: number, y: number) {
    return this.viewportManager.toViewportPt(x, y);
  }
  toSceneSize(size: number) {
    return this.viewportManager.toSceneSize(size);
  }
  toViewportSize(size: number) {
    return this.viewportManager.toViewportSize(size);
  }
  /** get cursor viewport xy */
  getCursorXY(event: { clientX: number; clientY: number }) {
    return {
      x: event.clientX - this.setting.get('offsetX'),
      y: event.clientY - this.setting.get('offsetY'),
    };
  }
  /** get cursor scene xy */
  getSceneCursorXY(event: { clientX: number; clientY: number }, round = false) {
    const { x, y } = this.getCursorXY(event);
    return this.toScenePt(x, y, round);
  }
  render() {
    this.sceneGraph.render();
  }

  getCanvasChildrenBbox() {
    const canvasGraphics = this.doc.getCurrentCanvas();
    if (!canvasGraphics) {
      return null;
    }
    const children = canvasGraphics
      .getChildren()
      .filter((item) => item.isVisible());
    if (children.length === 0) return null;
    return mergeBoxes(children.map((item) => item.getBbox()));
  }

  applyChanges(changes: IChanges) {
    const addedGraphicsArr: GraphicsAttrs[] = [];
    for (const [, attrs] of changes.added) {
      addedGraphicsArr.push(attrs);
    }
    this.sceneGraph.load(addedGraphicsArr, true);

    for (const [id, partialAttrs] of changes.update) {
      const graphics = this.doc.getGraphicsById(id);
      if (!graphics) {
        console.warn(`graphics ${id} is not exist`);
        continue;
      }
      graphics.updateAttrs(partialAttrs);
    }

    for (const id of changes.deleted) {
      const graphics = this.doc.getGraphicsById(id);
      if (!graphics) {
        console.warn(`graphics ${id} is not exist`);
        continue;
      }
      graphics.setDeleted(true);
      graphics.removeFromParent();
    }
  }

  on<T extends keyof Events>(eventName: T, listener: Events[T]) {
    this.emitter.on(eventName, listener);
  }
  off<T extends keyof Events>(eventName: T, listener: Events[T]) {
    this.emitter.off(eventName, listener);
  }
}
