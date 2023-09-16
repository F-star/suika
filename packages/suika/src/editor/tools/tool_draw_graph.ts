import { Graph } from '../scene/graph';
import { IPoint, IRect } from '../../type';
import { noop } from '../../utils/common';
import { normalizeRect } from '../../utils/graphics';
import { AddShapeCommand } from '../commands/add_shape';
import { Editor } from '../editor';
import { ITool } from './type';

/**
 * Draw Graph Tool
 *
 * reference: https://mp.weixin.qq.com/s/lD1qlGus3pRvT5ZfdH0_lg
 */
export abstract class DrawGraphTool implements ITool {
  static type = 'drawGraph';
  type = 'drawGraph';
  commandDesc = 'Add Graph';
  hotkey = '';

  protected drawingGraph: Graph | null = null;

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
    const updateRect = () => {
      if (this.isDragging) {
        this.updateRect();
      }
    };
    hotkeysManager.on('shiftToggle', updateRect);
    hotkeysManager.on('altToggle', updateRect);

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
      hotkeysManager.off('shiftToggle', updateRect);
      hotkeysManager.off('altToggle', updateRect);
      editor.viewportManager.off('xOrYChange', updateRectWhenViewportTranslate);
    };
  }
  inactive() {
    this.editor.setCursor('default');
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
    this.drawingGraph = null;
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

  protected adjustSizeWhenShiftPressing(rect: IRect) {
    // pressing Shift to draw a square
    const { width, height } = rect;
    const size = Math.max(Math.abs(width), Math.abs(height));
    rect.height = (Math.sign(height) || 1) * size;
    rect.width = (Math.sign(width) || 1) * size;
  }

  /**
   * update graph, and give the original rect (width may be negative)
   */
  protected updateGraph(rect: IRect) {
    rect = normalizeRect(rect);
    const drawingShape = this.drawingGraph!;
    drawingShape.x = rect.x;
    drawingShape.y = rect.y;
    drawingShape.width = rect.width;
    drawingShape.height = rect.height;
  }

  private updateRect() {
    if (!this.isDragging) return;

    const { x, y } = this.lastDragPoint;
    const sceneGraph = this.editor.sceneGraph;
    const { x: startX, y: startY } = this.startPoint;

    const width = x - startX;
    const height = y - startY;

    let rect = {
      x: startX,
      y: startY,
      width, // width may be negative
      height, // height may be negative
    };

    // whether to set the starting point as the center of the graph
    const isStartPtAsCenter = this.editor.hostEventManager.isAltPressing;
    // whether to keep the graph square
    const keepSquare = this.editor.hostEventManager.isShiftPressing;

    let cx = 0;
    let cy = 0;
    if (isStartPtAsCenter) {
      rect = {
        x: rect.x - width,
        y: rect.y - height,
        width: rect.width * 2,
        height: rect.height * 2,
      };

      cx = rect.x + rect.width / 2;
      cy = rect.y + rect.height / 2;
    }

    if (keepSquare) {
      this.adjustSizeWhenShiftPressing(rect);
    }

    if (isStartPtAsCenter) {
      rect.x = cx - rect.width / 2;
      rect.y = cy - rect.height / 2;
    }

    if (this.drawingGraph) {
      this.updateGraph(rect);
    } else {
      const element = this.createGraph(rect)!;
      sceneGraph.addItems([element]);

      this.drawingGraph = element;
    }
    this.editor.selectedElements.setItems([this.drawingGraph]);
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

    if (this.drawingGraph === null) {
      const { x: cx, y: cy } = endPoint;
      const width = this.editor.setting.get('drawGraphDefaultWidth');
      const height = this.editor.setting.get('drawGraphDefaultHeight');

      this.drawingGraph = this.createGraph(
        {
          x: cx - width / 2,
          y: cy - height / 2,
          width,
          height,
        },
        true,
      );
      if (this.drawingGraph) {
        this.editor.sceneGraph.addItems([this.drawingGraph]);

        this.editor.selectedElements.setItems([this.drawingGraph]);
        this.editor.sceneGraph.render();
      }
    }

    if (this.drawingGraph) {
      this.editor.commandManager.pushCommand(
        new AddShapeCommand(this.commandDesc, this.editor, [this.drawingGraph]),
      );
    }
  }

  afterEnd() {
    this.isDragging = false;
    this.editor.hostEventManager.enableDelete();
    this.editor.hostEventManager.enableContextmenu();
    if (this.drawingGraph) {
      this.editor.toolManager.setActiveTool('select');
    }
  }
}
