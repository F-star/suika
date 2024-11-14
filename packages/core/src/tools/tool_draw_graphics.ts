import { noop } from '@suika/common';
import {
  applyInverseMatrix,
  type IMatrixArr,
  type IPoint,
  type IRect,
  type ISize,
  normalizeRect,
} from '@suika/geo';

import { AddGraphCmd } from '../commands/add_graphs';
import { type ICursor } from '../cursor_manager';
import { type SuikaEditor } from '../editor';
import { isFrameGraphics, type SuikaGraphics } from '../graphics';
import { SnapHelper } from '../snap';
import { getDeepFrameAtPoint } from '../utils';
import { type ITool } from './type';

/**
 * Draw Graph Tool
 * reference: https://mp.weixin.qq.com/s/lD1qlGus3pRvT5ZfdH0_lg
 */
export abstract class DrawGraphicsTool implements ITool {
  static readonly type: string = '';
  static readonly hotkey: string = '';
  readonly type: string = '';
  readonly hotkey: string = '';
  cursor: ICursor = 'crosshair';
  commandDesc = 'Add Graphics';

  protected drawingGraphics: SuikaGraphics | null = null;

  private startPoint: IPoint = { x: -1, y: -1 };
  private lastDragPoint!: IPoint;
  private lastDragPointInViewport!: IPoint;
  /** lastPoint with snap when dragging */
  private lastMousePoint!: IPoint;
  /**
   * use to calculate the offset, to change the graphics's start point
   */
  private startPointWhenSpaceDown: IPoint | null = null;
  private lastDragPointWhenSpaceDown: IPoint | null = null;

  private isDragging = false;
  private unbindEvent: () => void = noop;

  constructor(protected editor: SuikaEditor) {}
  onActive() {
    const editor = this.editor;
    const hotkeysManager = editor.hostEventManager;
    const updateRect = () => {
      if (this.isDragging) {
        this.updateRect();
      }
    };
    hotkeysManager.on('shiftToggle', updateRect);

    const updateRectWhenViewportTranslate = () => {
      if (editor.hostEventManager.isDraggingCanvasBySpace) {
        return;
      }
      if (this.isDragging) {
        this.lastDragPoint = editor.toScenePt(
          this.lastDragPointInViewport.x,
          this.lastDragPointInViewport.y,
          this.editor.setting.get('snapToGrid'),
        );
        this.updateRect();
      }
    };
    editor.viewportManager.on('xOrYChange', updateRectWhenViewportTranslate);

    this.unbindEvent = () => {
      hotkeysManager.off('shiftToggle', updateRect);
      editor.viewportManager.off('xOrYChange', updateRectWhenViewportTranslate);
    };
  }

  onSpaceToggle(isSpacePressing: boolean) {
    if (this.isDragging && isSpacePressing) {
      this.startPointWhenSpaceDown = this.startPoint;
      this.lastDragPointWhenSpaceDown = this.lastMousePoint;
      this.updateRect();
    } else {
      this.startPointWhenSpaceDown = null;
      this.lastDragPointWhenSpaceDown = null;
    }
  }

  onAltToggle() {
    if (this.isDragging) {
      this.updateRect();
    }
  }

  onInactive() {
    this.unbindEvent();
  }
  onMoveExcludeDrag() {
    // do nothing;
  }

  onStart(e: PointerEvent) {
    this.startPoint = SnapHelper.getSnapPtBySetting(
      this.editor.getSceneCursorXY(e),
      this.editor.setting,
    );
    this.drawingGraphics = null;
    this.isDragging = false;
    this.startPointWhenSpaceDown = null;
    this.lastDragPointWhenSpaceDown = null;
  }

  onDrag(e: PointerEvent) {
    this.editor.hostEventManager.disableDelete();
    this.editor.hostEventManager.disableContextmenu();
    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }
    this.isDragging = true;
    this.lastDragPointInViewport = this.editor.getCursorXY(e);

    this.lastDragPoint = this.lastMousePoint = SnapHelper.getSnapPtBySetting(
      this.editor.getSceneCursorXY(e),
      this.editor.setting,
    );
    this.updateRect();
  }
  /**
   * create graphics, and give the original rect (width may be negative)
   * noMove: if true, the graphics will not move when drag
   */
  protected abstract createGraphics(
    rect: IRect,
    noMove?: boolean,
  ): SuikaGraphics | null;

  protected adjustSizeWhenShiftPressing(rect: IRect) {
    // pressing Shift to draw a square
    const { width, height } = rect;
    const size = Math.max(Math.abs(width), Math.abs(height));
    rect.height = (Math.sign(height) || 1) * size;
    rect.width = (Math.sign(width) || 1) * size;
    return rect;
  }

  /**
   * update graphics, and give the original rect (width may be negative)
   */
  protected updateGraphics(rect: IRect) {
    rect = normalizeRect(rect);
    const drawingShape = this.drawingGraphics!;

    const parent = drawingShape.getParent();
    let x = rect.x;
    let y = rect.y;
    if (parent && isFrameGraphics(parent)) {
      const tf = parent.getWorldTransform();
      const point = applyInverseMatrix(tf, rect);
      x = point.x;
      y = point.y;
    }

    drawingShape.updateAttrs({
      x: x,
      y: y,
      width: rect.width,
      height: rect.height,
    });
  }

  /** update drawing rect object */
  private updateRect() {
    if (!this.isDragging) return;

    const { x, y } = this.lastDragPoint;
    const sceneGraph = this.editor.sceneGraph;

    if (this.startPointWhenSpaceDown && this.lastDragPointWhenSpaceDown) {
      const { x: sx, y: sy } = this.startPointWhenSpaceDown;
      const { x: lx, y: ly } = this.lastDragPointWhenSpaceDown;
      const dx = x - lx;
      const dy = y - ly;
      this.startPoint = {
        x: sx + dx,
        y: sy + dy,
      };
    }

    const { x: startX, y: startY } = this.startPoint;

    let width = x - startX;
    let height = y - startY;

    if (width === 0 || height === 0) {
      const size = this.solveWidthOrHeightIsZero(
        { width, height },
        {
          x: this.lastMousePoint.x - this.startPoint.x,

          y: this.lastMousePoint.y - this.startPoint.y,
        },
      );
      width = size.width;
      height = size.height;
    }

    let rect = {
      x: startX,
      y: startY,
      width, // width may be negative
      height, // height may be negative
    };

    // whether to set the starting point as the center of the graphics
    const isStartPtAsCenter = this.editor.hostEventManager.isAltPressing;
    // whether to keep the graphics square
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
      rect = this.adjustSizeWhenShiftPressing(rect);
    }

    if (isStartPtAsCenter) {
      rect.x = cx - rect.width / 2;
      rect.y = cy - rect.height / 2;
    }

    if (this.drawingGraphics) {
      this.updateGraphics(rect);
    } else {
      const graphics = this.createGraphics(rect)!;
      const currentCanvas = this.editor.doc.getCurrCanvas();
      const frame = getDeepFrameAtPoint(
        this.startPoint,
        currentCanvas.getChildren(),
      );

      sceneGraph.addItems([graphics]);

      if (frame) {
        const tf = [...graphics.attrs.transform] as IMatrixArr;
        frame.insertChild(graphics);
        graphics.setWorldTransform(tf);
      } else {
        currentCanvas.insertChild(graphics);
      }

      this.drawingGraphics = graphics;
    }
    this.editor.selectedElements.setItems([this.drawingGraphics]);
    sceneGraph.render();
  }

  protected solveWidthOrHeightIsZero(size: ISize, delta: IPoint): ISize {
    const newSize = { width: size.width, height: size.height };
    if (size.width === 0) {
      const sign = Math.sign(delta.x) || 1;
      newSize.width = sign * this.editor.setting.get('gridSnapX');
    }
    if (size.height === 0) {
      const sign = Math.sign(delta.y) || 1;
      newSize.height = sign * this.editor.setting.get('gridSnapY');
    }
    return newSize;
  }

  onEnd(e: PointerEvent) {
    if (this.editor.hostEventManager.isDraggingCanvasBySpace) {
      return;
    }

    const endPoint = SnapHelper.getSnapPtBySetting(
      this.editor.getSceneCursorXY(e),
      this.editor.setting,
    );

    if (this.drawingGraphics === null) {
      const { x: cx, y: cy } = endPoint;
      const width = this.editor.setting.get('drawGraphDefaultWidth');
      const height = this.editor.setting.get('drawGraphDefaultHeight');

      this.drawingGraphics = this.createGraphics(
        {
          x: cx - width / 2,
          y: cy - height / 2,
          width,
          height,
        },
        true,
      );

      if (this.drawingGraphics) {
        this.editor.doc.getCurrCanvas().insertChild(this.drawingGraphics);
        this.editor.sceneGraph.addItems([this.drawingGraphics]);

        this.editor.selectedElements.setItems([this.drawingGraphics]);
        this.editor.render();
      }
    }

    if (this.drawingGraphics) {
      this.editor.commandManager.pushCommand(
        new AddGraphCmd(this.commandDesc, this.editor, [this.drawingGraphics]),
      );
    }
  }

  afterEnd() {
    this.isDragging = false;
    this.editor.hostEventManager.enableDelete();
    this.editor.hostEventManager.enableContextmenu();
    if (
      this.drawingGraphics &&
      !this.editor.setting.get('keepToolSelectedAfterUse')
    ) {
      this.editor.toolManager.setActiveTool('select');
    }
    this.startPointWhenSpaceDown = null;
    this.lastDragPointWhenSpaceDown = null;
  }
}
