import { Graph } from '../scene/graph';
import { IPoint, IRect } from '../../type';
import { noop } from '../../utils/common';
import { normalizeRect } from '../../utils/graphics';
import { AddShapeCommand } from '../commands/add_shape';
import { Editor } from '../editor';
import { ITool } from './type';

export abstract class DrawShapeTool implements ITool {
  static type = 'drawShape';
  type = 'drawShape';
  commandDesc = 'Add Shape';
  hotkey = '';

  protected drawingShape: Graph | null = null;

  private startPoint: IPoint = { x: -1, y: -1 };
  private lastDragPoint!: IPoint;
  private lastDragPointInViewport!: IPoint;

  private isDragging = false;
  private unbindEvent: () => void = noop;

  constructor(protected editor: Editor) {}
  active() {
    const editor = this.editor;
    editor.setCursor('crosshair');

    const hotkeysManager = editor.hostEventManager;
    const updateRectWhenShiftToggle = () => {
      if (this.isDragging) {
        this.updateRect();
      }
    };
    hotkeysManager.on('shiftToggle', updateRectWhenShiftToggle);

    const updateRectWhenViewportTranslate = () => {
      if (editor.hostEventManager.isDraggingCanvasBySpace) {
        return;
      }
      if (this.isDragging) {
        this.lastDragPoint = editor.viewportCoordsToScene(
          this.lastDragPointInViewport.x,
          this.lastDragPointInViewport.y,
          this.editor.setting.get('snapToPixelGrid'),
        );
        this.updateRect();
      }
    };
    editor.viewportManager.on('xOrYChange', updateRectWhenViewportTranslate);

    this.unbindEvent = () => {
      hotkeysManager.off('shiftToggle', updateRectWhenShiftToggle);
      editor.viewportManager.off('xOrYChange', updateRectWhenViewportTranslate);
    };
  }
  inactive() {
    this.editor.setCursor('');

    this.unbindEvent();
  }
  moveExcludeDrag() {
    // do nothing;
  }
  start(e: PointerEvent) {
    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }
    this.startPoint = this.editor.getSceneCursorXY(
      e,
      this.editor.setting.get('snapToPixelGrid'),
    );
    this.drawingShape = null;
    this.isDragging = false;
  }
  drag(e: PointerEvent) {
    this.editor.hostEventManager.disableDelete();
    this.editor.hostEventManager.disableContextmenu();
    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }
    this.isDragging = true;
    this.lastDragPointInViewport = this.editor.getCursorXY(e);

    this.lastDragPoint = this.editor.getSceneCursorXY(
      e,
      this.editor.setting.get('snapToPixelGrid'),
    );
    this.updateRect();
  }
  /**
   * create graph, and give the original rect (width may be negative)
   * noMove: if true, the graph will not move when drag
   */
  protected abstract createGraph(rect: IRect, noMove?: boolean): Graph | null;
  /**
   * update graph, and give the original rect (width may be negative)
   */
  protected updateGraph(rect: IRect) {
    rect = normalizeRect(rect);
    const drawingShape = this.drawingShape!;
    drawingShape.x = rect.x;
    drawingShape.y = rect.y;
    drawingShape.width = rect.width;
    drawingShape.height = rect.height;
  }
  private updateRect() {
    const { x, y } = this.lastDragPoint;
    const sceneGraph = this.editor.sceneGraph;
    const { x: startX, y: startY } = this.startPoint;

    const width = x - startX;
    const height = y - startY;

    const rect = {
      x: startX,
      y: startY,
      width, // width may be negative
      height, // height may be negative
    };

    // pressing Shift to draw a square
    if (this.editor.hostEventManager.isShiftPressing) {
      if (Math.abs(width) > Math.abs(height)) {
        rect.height = (Math.sign(height) || 1) * Math.abs(width);
      } else {
        rect.width = (Math.sign(width) || 1) * Math.abs(height);
      }
    }

    if (this.drawingShape) {
      this.updateGraph(rect);
    } else {
      const element = this.createGraph(rect)!;
      sceneGraph.addItems([element]);

      this.drawingShape = element;
    }
    this.editor.selectedElements.setItems([this.drawingShape]);
    sceneGraph.render();
  }
  end(e: PointerEvent) {
    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }

    const endPoint = this.editor.getSceneCursorXY(
      e,
      this.editor.setting.get('snapToPixelGrid'),
    );

    if (this.drawingShape === null) {
      const { x: cx, y: cy } = endPoint;
      const width = this.editor.setting.get('drawGraphDefaultWidth');
      const height = this.editor.setting.get('drawGraphDefaultHeight');

      this.drawingShape = this.createGraph(
        {
          x: cx - width / 2,
          y: cy - height / 2,
          width,
          height,
        },
        true,
      );
      if (this.drawingShape) {
        this.editor.sceneGraph.addItems([this.drawingShape]);

        this.editor.selectedElements.setItems([this.drawingShape]);
        this.editor.sceneGraph.render();
      }
    }

    if (this.drawingShape) {
      this.editor.commandManager.pushCommand(
        new AddShapeCommand(this.commandDesc, this.editor, [this.drawingShape]),
      );
    }
  }

  afterEnd() {
    this.isDragging = false;
    this.editor.hostEventManager.enableDelete();
    this.editor.hostEventManager.enableContextmenu();
    if (this.drawingShape) {
      this.editor.toolManager.setActiveTool('select');
    }
  }
}
