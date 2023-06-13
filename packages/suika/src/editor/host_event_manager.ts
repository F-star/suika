/**
 * 按键、鼠标事件管理
 */

import hotkeys from 'hotkeys-js';
import { IBox, IPoint } from '../type.interface';
import EventEmitter from '../utils/event_emitter';
import { Editor } from './editor';

interface Events {
  shiftToggle(): void;
  contextmenu(point: IPoint): void;
}

class HostEventManager {
  isShiftPressing = false;
  isCtrlPressing = false;
  isCommandPressing = false;
  isSpacePressing = false;

  isDraggingCanvasBySpace = false;
  isEnableDragCanvasBySpace = true;
  isEnableDelete = true;
  isEnableContextMenu = true;

  private prevCursor = '';
  private eventEmitter = new EventEmitter<Events>();
  private unbindHandlers: Array<() => void> = [];

  constructor(private editor: Editor) {}
  bindHotkeys() {
    this.bindModifiersRecordEvent(); // 记录 isShiftPressing 等值
    this.bindActionHotkeys(); // 操作快捷键，比如 ctrl+z 撤销
    this.bindWheelEventToZoom(); // 滚轮移动画布
    this.bindDragCanvasEvent(); // 空格和拖拽移动画布
    this.bindContextMenu();
  }
  private bindModifiersRecordEvent() {
    // record if shift, ctrl, command is pressed
    hotkeys('*', { keydown: true, keyup: true }, (event) => {
      if (hotkeys.shift) {
        const prev = this.isShiftPressing;
        if (event.type === 'keydown') {
          this.isShiftPressing = true;
        } else if (event.type === 'keyup') {
          this.isShiftPressing = false;
        }

        if (prev !== this.isShiftPressing) {
          this.eventEmitter.emit('shiftToggle');
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

    hotkeys('space', { keydown: true, keyup: true }, (event) => {
      const prev = this.isSpacePressing;
      if (event.type === 'keydown') {
        this.isSpacePressing = true;
      } else if (event.type === 'keyup') {
        this.isSpacePressing = false;
      }

      // 按住按键会不停触发响应函数，下面这种写法则只会在按下和释放时分别执行一次
      if (this.isEnableDragCanvasBySpace && prev !== this.isSpacePressing) {
        if (this.isSpacePressing) {
          this.prevCursor = this.editor.getCursor();
          this.editor.setCursor('grab');
        } else {
          if (!this.isDraggingCanvasBySpace) {
            this.editor.setCursor(this.prevCursor);
          }
        }
      }
    });
  }
  /**
   * shiftToggle 会在切换时触发。按住 shift 不放，只会触发一次
   */
  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }
  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
  private bindActionHotkeys() {
    hotkeys('ctrl+z, command+z', { keydown: true }, () => {
      this.editor.commandManager.undo();
    });
    hotkeys('ctrl+shift+z, command+shift+z', { keydown: true }, () => {
      this.editor.commandManager.redo();
    });
    hotkeys('backspace, delete', { keydown: true }, () => {
      // TODO: 一些情况下是不能进行删除操作的
      // 1. 绘制图形过程中
      //
      // 可以删除但要特殊处理的情况
      // 2. 对图形旋转或缩放时，可以删除，注意处理绘制矩形。
      if (this.isEnableDelete) {
        this.editor.selectedElements.removeFromScene();
      }
    });
  }
  private bindWheelEventToZoom() {
    const editor = this.editor;
    const handler = (event: WheelEvent) => {
      if (this.isCtrlPressing || this.isCommandPressing) {
        event.preventDefault();
        const { x: cx, y: cy } = this.editor.getCursorXY(event);
        if (event.deltaY > 0) {
          editor.zoomManager.zoomOut(cx, cy);
          editor.sceneGraph.render();
        } else if (event.deltaY < 0) {
          editor.zoomManager.zoomIn(cx, cy);
          editor.sceneGraph.render();
        }
      } else {
        const zoom = editor.zoomManager.getZoom();
        editor.viewportManager.translate(
          event.deltaX / zoom,
          event.deltaY / zoom,
        );
        editor.sceneGraph.render();
      }
    };
    editor.canvasElement.addEventListener('wheel', handler);

    this.unbindHandlers.push(() => {
      editor.canvasElement.removeEventListener('wheel', handler);
    });
  }

  private bindDragCanvasEvent() {
    let isEnableDrag = false;
    let startPointer: IPoint | null = null;
    let prevViewport: IBox;

    // 鼠标按下
    const pointerdownHandler = (event: PointerEvent) => {
      isEnableDrag = false;
      startPointer = null;
      this.isDraggingCanvasBySpace = false;

      if (this.isEnableDragCanvasBySpace && this.isSpacePressing) {
        this.editor.setCursor('grabbing');
        this.isDraggingCanvasBySpace = true;
        startPointer = this.editor.getCursorXY(event);
        prevViewport = this.editor.viewportManager.getViewport();
      }
    };
    this.editor.canvasElement.addEventListener(
      'pointerdown',
      pointerdownHandler,
    );

    // drag canvas when mouse move
    const pointermoveHandler = (event: PointerEvent) => {
      if (startPointer) {
        const viewportPos = this.editor.getCursorXY(event);
        const dx = viewportPos.x - startPointer.x;
        const dy = viewportPos.y - startPointer.y;
        const dragBlockStep = this.editor.setting.get('dragBlockStep');
        if (
          (!isEnableDrag && Math.abs(dx) > dragBlockStep) ||
          Math.abs(dy) > dragBlockStep
        ) {
          isEnableDrag = true;
        }
        if (isEnableDrag) {
          const zoom = this.editor.zoomManager.getZoom();
          const viewportX = prevViewport.x - dx / zoom;
          const viewportY = prevViewport.y - dy / zoom;

          this.editor.viewportManager.setViewport({
            x: viewportX,
            y: viewportY,
          });
          this.editor.sceneGraph.render();
        }
      }
    };
    window.addEventListener('pointermove', pointermoveHandler);

    // 鼠标释放
    const pointerupHandler = () => {
      if (this.isDraggingCanvasBySpace) {
        this.editor.setCursor(this.isSpacePressing ? 'grab' : this.prevCursor);
      }
      isEnableDrag = false;
      startPointer = null;
      // we hope reset isDraggingCanvasBySpace after exec tool.end()
      setTimeout(() => {
        this.isDraggingCanvasBySpace = false;
      });
    };
    window.addEventListener('pointerup', pointerupHandler);

    this.unbindHandlers.push(() => {
      this.editor.canvasElement.removeEventListener(
        'pointerdown',
        pointerdownHandler,
      );
      window.removeEventListener('pointermove', pointermoveHandler);
      window.removeEventListener('pointerup', pointerupHandler);
    });
  }

  private bindContextMenu() {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      if (this.isEnableContextMenu) {
        this.eventEmitter.emit('contextmenu', { x: e.clientX, y: e.clientY });
      }
    };
    this.editor.canvasElement.addEventListener('contextmenu', handler);
    this.unbindHandlers.push(() => {
      this.editor.canvasElement.removeEventListener('contextmenu', handler);
    });
  }

  enableDragBySpace() {
    this.isEnableDragCanvasBySpace = true;
  }
  disableDragBySpace() {
    this.isEnableDragCanvasBySpace = false;
  }
  enableDelete() {
    this.isEnableDelete = true;
  }
  disableDelete() {
    this.isEnableDelete = false;
  }
  enableContextmenu() {
    this.isEnableContextMenu = true;
  }
  disableContextmenu() {
    this.isEnableContextMenu = false;
  }
  destroy() {
    hotkeys.unbind();
    this.unbindHandlers.forEach((fn) => fn());
    this.unbindHandlers = [];
  }
}

export default HostEventManager;
